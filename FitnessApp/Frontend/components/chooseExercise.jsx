import React, { useState, useEffect, useRef, useCallback } from 'react';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import { Base64 } from 'js-base64';
import './chooseExercise.css';

const ChooseExercise = ({ onExerciseSelect }) => {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [authToken, setAuthToken] = useState(null);
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
    const [loadingMuscleGroups, setLoadingMuscleGroups] = useState(false);
    
    // Get auth token from secureStorage on component mount
    useEffect(() => {
        const getAuthToken = async () => {
            try {
                const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
                if (token) {
                    setAuthToken(token);
                } else {
                    setError('Authentication required. Please log in.');
                }
            } catch (err) {
                console.error('Error retrieving auth token:', err);
                setError('Failed to retrieve authentication token');
            }
        };
        
        getAuthToken();
    }, []);
    
    // Fetch muscle groups
    useEffect(() => {
        if (!authToken) return;
        
        const fetchMuscleGroups = async () => {
            try {
                setLoadingMuscleGroups(true);
                
                // Get auth headers
                const headers = await secureStorage.getAuthHeader();
                if (!headers) {
                    throw new Error('No authentication token available');
                }
                
                const response = await fetch(`http://localhost:8080/api/workout/get_exercise_muscles`, {
                    headers: headers
                });
                
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('Authentication failed. Please log in again.');
                    } else {
                        throw new Error(`Failed to fetch muscle groups: ${response.statusText}`);
                    }
                }
                
                const data = await response.json();
                console.log("Muscle Groups API Response:", data);
                
                if (data.muscles && Array.isArray(data.muscles)) {
                    // Format muscle names
                    const formattedMuscles = data.muscles.map(muscle => {
                        const muscleStr = String(muscle);
                        let formatted = muscleStr;
                        
                        if (muscleStr.startsWith('{') && muscleStr.endsWith('}')) {
                            formatted = muscleStr.substring(1, muscleStr.length - 1);
                        }
                        
                        formatted = formatted.replace(/['"]/g, '');
                        return {
                            value: muscle, // Keep original value for API
                            label: formatted.charAt(0).toUpperCase() + formatted.slice(1) // Formatted for display
                        };
                    });
                    
                    setMuscleGroups(formattedMuscles);
                }
                
                setLoadingMuscleGroups(false);
            } catch (err) {
                console.error('Error fetching muscle groups:', err);
                setLoadingMuscleGroups(false);
                
                if (err.message.includes('Authentication failed')) {
                    secureStorage.removeItem(AUTH_TOKEN_KEY);
                }
            }
        };
        
        fetchMuscleGroups();
    }, [authToken]);
    
    const observer = useRef();
    const lastExerciseElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.5 });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Reset page when muscle group changes
    useEffect(() => {
        setExercises([]);
        setCurrentPage(1);
        setHasMore(true);
    }, [selectedMuscleGroup]);
    
    useEffect(() => {
        // Only fetch exercises if we have the auth token
        if (!authToken) return;
        
        const fetchExercises = async () => {
            try {
                setLoading(true);
                
                // Get auth headers
                const headers = await secureStorage.getAuthHeader();
                if (!headers) {
                    throw new Error('No authentication token available');
                }
                
                // Build URL with optional muscle group filter
                let url = `http://localhost:8080/api/workout/get_exercises?page=${currentPage}`;
                if (selectedMuscleGroup) {
                    url += `&muscle_group=${encodeURIComponent(selectedMuscleGroup)}`;
                }
                
                const response = await fetch(url, {
                    headers: headers
                });
                
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('Authentication failed. Please log in again.');
                    } else {
                        throw new Error(`Failed to fetch exercises: ${response.statusText}`);
                    }
                }
                
                const data = await response.json();
                console.log("API Response:", data);
                
                if (!data.exercises || data.exercises.length === 0) {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                
                if (data.page) {
                    setHasMore(true);
                } else {
                    setHasMore(false);
                }
                
                // Transform the exercises
                const transformedExercises = data.exercises.map(exercise => ({
                    id: exercise.id,
                    name: exercise.name,
                    description: exercise.description,
                    primary_muscle: exercise.primary_muscle || [],
                    secondarry_muscle: exercise.secondary_muscle || [] // Fix the field name here
                }));
                
                // Add new exercises to existing ones
                const newExercises = currentPage === 1 
                    ? transformedExercises 
                    : [...exercises, ...transformedExercises];
                
                // Sort all exercises alphabetically by name
                newExercises.sort((a, b) => a.name.localeCompare(b.name));
                
                setExercises(newExercises);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching exercises:', err);
                setError(err.message);
                setLoading(false);
                
                if (err.message.includes('Authentication failed')) {
                    secureStorage.removeItem(AUTH_TOKEN_KEY);
                }
            }
        };

        fetchExercises();
    }, [currentPage, authToken, selectedMuscleGroup]);

    const handleExerciseClick = (exercise) => {
        onExerciseSelect(exercise);
    };
    
    const handleMuscleGroupChange = (event) => {
        setSelectedMuscleGroup(event.target.value);
    };

    // Helper function to format muscle name (remove brackets and handle objects)
    const formatMuscleName = (muscle) => {
        if (!muscle) return "Stretch";
        
        // If it's an object with toString() that produces brackets, convert it to string and remove brackets
        let muscleStr = String(muscle);
        if (muscleStr.startsWith('{') && muscleStr.endsWith('}')) {
            muscleStr = muscleStr.substring(1, muscleStr.length - 1);
        }
        // Remove any quotes
        muscleStr = muscleStr.replace(/['"]/g, '');
        
        // Capitalize first letter
        return muscleStr.charAt(0).toUpperCase() + muscleStr.slice(1);
    };

    if ((loading && currentPage === 1 && !exercises.length) || !authToken) return <p>Loading exercises...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="exercise-selector">
            <h1>Choose an Exercise</h1>
            
            <div className="filter-container">
                <label htmlFor="muscle-group-filter">Filter by muscle group:</label>
                <select 
                    id="muscle-group-filter"
                    value={selectedMuscleGroup}
                    onChange={handleMuscleGroupChange}
                    disabled={loadingMuscleGroups}
                    className="muscle-group-select"
                >
                    <option value="">All muscle groups</option>
                    {muscleGroups.map((muscle, index) => (
                        <option key={index} value={muscle.value}>
                            {muscle.label}
                        </option>
                    ))}
                </select>
                
                {loadingMuscleGroups && (
                    <span className="loading-small">Loading muscle groups...</span>
                )}
            </div>
            
            {exercises.length === 0 && !loading ? (
                <p className="no-exercises">No exercises found for the selected muscle group.</p>
            ) : (
                <div className="exercise-grid">
                    {exercises.map((exercise, index) => {
                        // Get the primary and secondary muscles with proper formatting
                        const primaryMuscle = exercise.primary_muscle 
                            ? formatMuscleName(exercise.primary_muscle)
                            : "Stretch";
                            
                        // For secondary muscles, check if it's an array or string
                        let secondaryMuscles = "";
                        if (exercise.secondarry_muscle) {
                            if (Array.isArray(exercise.secondarry_muscle)) {
                                secondaryMuscles = exercise.secondarry_muscle.map(formatMuscleName).join(', ');
                            } else {
                                secondaryMuscles = formatMuscleName(exercise.secondarry_muscle);
                            }
                        }
                        
                        // Truncate description to one line
                        const shortDescription = exercise.description 
                            ? exercise.description.length > 60 
                                ? exercise.description.substring(0, 60) + '...' 
                                : exercise.description
                            : '';
                        
                        return (
                            <div 
                                key={exercise.id || index}
                                ref={index === exercises.length - 1 ? lastExerciseElementRef : null}
                                className="exercise-tile"
                            >
                                <button 
                                    className="exercise-tile-button"
                                    onClick={() => handleExerciseClick(exercise)}
                                >
                                    <div className="exercise-tile-name">{exercise.name || "Exercise"}</div>
                                    
                                    {shortDescription && (
                                        <div className="exercise-tile-description">{shortDescription}</div>
                                    )}
                                    
                                    <div className="exercise-tile-muscles">
                                        <div className="exercise-tile-primary">
                                            <span className="muscle-label">Primary:</span> {primaryMuscle}
                                        </div>
                                        
                                        {secondaryMuscles && (
                                            <div className="exercise-tile-secondary">
                                                <span className="muscle-label">Secondary:</span> {secondaryMuscles}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {loading && (
                <div className="loading-indicator">Loading more exercises...</div>
            )}
            
            {!hasMore && exercises.length > 0 && (
                <p className="end-message">No more exercises to load</p>
            )}
        </div>
    );
};

export default ChooseExercise;