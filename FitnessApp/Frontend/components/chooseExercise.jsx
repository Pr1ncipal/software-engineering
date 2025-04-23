import React, { useState, useEffect, useRef, useCallback } from 'react';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';
import { Base64 } from 'js-base64';
import './chooseExercise.css';

const ChooseExercise = ({ onExerciseSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allExercises, setAllExercises] = useState([]);  // Store all fetched exercises
    const [filteredExercises, setFilteredExercises] = useState([]); // Displayed exercises
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [authToken, setAuthToken] = useState(null);
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
    const [loadingMuscleGroups, setLoadingMuscleGroups] = useState(false);
    
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
    
    useEffect(() => {
        if (!authToken) return;
        
        const fetchMuscleGroups = async () => {
            try {
                setLoadingMuscleGroups(true);
                
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
                    const formattedMuscles = data.muscles.map(muscle => {
                        const muscleStr = String(muscle);
                        let formatted = muscleStr;
                        
                        if (muscleStr.startsWith('{') && muscleStr.endsWith('}')) {
                            formatted = muscleStr.substring(1, muscleStr.length - 1);
                        }
                        
                        formatted = formatted.replace(/['"]/g, '');
                        return {
                            value: muscle,
                            label: formatted.charAt(0).toUpperCase() + formatted.slice(1)
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

    useEffect(() => {
        setAllExercises([]);
        setFilteredExercises([]);
        setCurrentPage(0);
        setHasMore(true);
    }, [selectedMuscleGroup]);
    
    useEffect(() => {
        if (!authToken) return;
        
        const fetchExercises = async () => {
            try {
                setLoading(true);
                
                const headers = await secureStorage.getAuthHeader();
                if (!headers) {
                    throw new Error('No authentication token available');
                }
                
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
                
                if (data.exercises && data.exercises.length > 0) {
                    setHasMore(true);
                } else {
                    setHasMore(false);
                }
                // Only use the page from response for debugging, not for setting state
                console.log(`Received page ${data.page}, our currentPage is ${currentPage}`);
                
                const transformedExercises = data.exercises.map(exercise => ({
                    id: exercise.id,
                    name: exercise.name,
                    description: exercise.description,
                    primary_muscle: exercise.primary_muscle || [],
                    secondary_muscle: exercise.secondary_muscle || []
                }));
                
                const newAllExercises = currentPage === 0
                    ? transformedExercises // Only replace on first page (page 0)
                    : [...allExercises, ...transformedExercises];
                
                newAllExercises.sort((a, b) => a.name.localeCompare(b.name));
                setAllExercises(newAllExercises);
                
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
    
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredExercises(allExercises);
            return;
        }
        
        const query = searchQuery.toLowerCase().trim();
        
        const filtered = allExercises.filter(exercise => {
            const nameMatches = exercise.name && 
                exercise.name.toLowerCase().includes(query);
            
            const descriptionMatches = exercise.description && 
                exercise.description.toLowerCase().includes(query);
            
            const primaryMuscleMatches = exercise.primary_muscle && 
                formatMuscleName(exercise.primary_muscle).toLowerCase().includes(query);
            
            let secondaryMuscleMatches = false;
            if (exercise.secondary_muscle) {
                if (Array.isArray(exercise.secondary_muscle)) {
                    secondaryMuscleMatches = exercise.secondary_muscle.some(muscle => 
                        formatMuscleName(muscle).toLowerCase().includes(query)
                    );
                } else {
                    secondaryMuscleMatches = formatMuscleName(exercise.secondary_muscle)
                        .toLowerCase().includes(query);
                }
            }
            
            return nameMatches || descriptionMatches || 
                   primaryMuscleMatches || secondaryMuscleMatches;
        });
        
        setFilteredExercises(filtered);
    }, [searchQuery, allExercises]);

    const handleExerciseClick = (exercise) => {
        onExerciseSelect(exercise);
    };
    
    const handleMuscleGroupChange = (event) => {
        setSelectedMuscleGroup(event.target.value);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const formatMuscleName = (muscle) => {
        if (!muscle) return "Stretch";
        
        let muscleStr = String(muscle);
        if (muscleStr.startsWith('{') && muscleStr.endsWith('}')) {
            muscleStr = muscleStr.substring(1, muscleStr.length - 1);
        }
        muscleStr = muscleStr.replace(/['"]/g, '');
        
        return muscleStr.charAt(0).toUpperCase() + muscleStr.slice(1);
    };

    if ((loading && currentPage === 1 && !allExercises.length) || !authToken) {
        return <p>Loading exercises...</p>;
    }
    
    if (error) return <p>Error: {error}</p>;

    const exercisesToDisplay = filteredExercises.length > 0 ? filteredExercises : allExercises;

    return (
        <div className="exercise-selector">
            <h1>Choose an Exercise</h1>
            
            <div className="search-container" style={{ maxWidth: '600px' }}>
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>
            
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
            
            {exercisesToDisplay.length === 0 && !loading ? (
                <p className="no-exercises">
                    {searchQuery ? 
                        `No exercises found matching "${searchQuery}"` : 
                        "No exercises found for the selected muscle group."}
                </p>
            ) : (
                <div className="exercise-grid">
                    {exercisesToDisplay.map((exercise, index) => {
                        const primaryMuscle = exercise.primary_muscle 
                            ? formatMuscleName(exercise.primary_muscle)
                            : "Stretch";
                            
                        let secondaryMuscles = "";
                        if (exercise.secondary_muscle) {
                            if (Array.isArray(exercise.secondary_muscle)) {
                                secondaryMuscles = exercise.secondary_muscle.map(formatMuscleName).join(', ');
                            } else {
                                secondaryMuscles = formatMuscleName(exercise.secondary_muscle);
                            }
                        }
                        
                        const shortDescription = exercise.description 
                            ? exercise.description.length > 60 
                                ? exercise.description.substring(0, 60) + '...' 
                                : exercise.description
                            : '';
                        
                        return (
                            <div 
                                key={exercise.id || index}
                                ref={index === exercisesToDisplay.length - 1 ? lastExerciseElementRef : null}
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
            
            {!hasMore && !searchQuery && allExercises.length > 0 && (
                <p className="end-message">No more exercises to load</p>
            )}
        </div>
    );
};

export default ChooseExercise;