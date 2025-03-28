import React, { useState, useEffect, useRef, useCallback } from 'react';
import './chooseExercise.css';  // Add this import

const ChooseExercise = ({ onExerciseSelect }) => {
    const [exercises, setExercises] = useState([]);
    const [sortedExercises, setSortedExercises] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    const observer = useRef();
    const lastExerciseElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.5 }); // Trigger when element is 50% visible
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                setLoading(true);
                const response = await fetch(`https://api.example.com/exercises?page=${currentPage}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch exercises');
                }
                const data = await response.json();
                
                // Check if we're at the last page
                if (!data.exercises || data.exercises.length === 0) {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
                
                // Parse page data to determine if more pages exist
                if (data.page) {
                    setHasMore(true);
                } else {
                    setHasMore(false);
                }
                
                // Add new exercises to existing ones
                const newExercises = currentPage === 1 
                    ? data.exercises 
                    : [...exercises, ...data.exercises];
                
                setExercises(newExercises);
                sortExercisesByMuscleGroup(newExercises);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchExercises();
    }, [currentPage]);

    const sortExercisesByMuscleGroup = (exerciseData) => {
        const grouped = exerciseData.reduce((acc, exercise) => {
            // Handle the JSON structure with muscleGroup array
            const primaryMuscle = Array.isArray(exercise.muscleGroup) 
                ? exercise.muscleGroup[0] 
                : exercise.muscleGroup || exercise.primaryMuscleGroup;
                
            if (!acc[primaryMuscle]) {
                acc[primaryMuscle] = [];
            }
            acc[primaryMuscle].push(exercise);
            return acc;
        }, {});
        
        // Sort exercises alphabetically within each group
        Object.keys(grouped).forEach(muscleGroup => {
            grouped[muscleGroup].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        setSortedExercises(grouped);
    };

    const handleExerciseClick = (exercise) => {
        onExerciseSelect(exercise);
    };

    if (loading && currentPage === 1) return <p>Loading exercises...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="exercise-selector">
            <h1>Choose an Exercise</h1>
            {Object.keys(sortedExercises).sort().map(muscleGroup => (
                <div key={muscleGroup} className="muscle-group">
                    <h2>{muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}</h2>
                    <ul className="exercise-list">
                        {sortedExercises[muscleGroup].map((exercise, index) => {
                            // Only attach ref to the very last element across all groups
                            const isLastElement = index === sortedExercises[muscleGroup].length - 1 && 
                                muscleGroup === Object.keys(sortedExercises).sort()[Object.keys(sortedExercises).length - 1];
                            
                            return (
                                <li 
                                    key={exercise.id} 
                                    ref={isLastElement ? lastExerciseElementRef : null}
                                    className="exercise-item"
                                >
                                    <button 
                                        className="exercise-button" 
                                        onClick={() => handleExerciseClick(exercise)}
                                    >
                                        <div className="exercise-name">{exercise.name}</div>
                                        <div className="exercise-muscles">
                                            {Array.isArray(exercise.muscleGroup) 
                                                ? `Works: ${exercise.muscleGroup.join(', ')}` 
                                                : null}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
            {loading && currentPage > 1 && (
                <div className="loading-indicator">Loading more exercises...</div>
            )}
            {!hasMore && exercises.length > 0 && (
                <p className="end-message">No more exercises to load</p>
            )}
        </div>
    );
};

export default ChooseExercise;