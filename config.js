const config = {
    tree: {
        maxDepth: 4,
        branchingFactor: 3,
        padding: 50,
        radialSpacing: 50 // New parameter for concentric circle spacing
    },
    forces: {
        edgeLength: 80,
        repulsionStrength: 500,
        attractionStrength: 0.05, // Increased for stronger pull
        dampingFactor: 0.95, // Increased to reduce oscillations
        minForceDistance: 7  // New parameter to prevent extreme forces at small distances
    },
    appearance: {
        nodeRadius: 15, // Increased significantly for easier clicking
        nodeColor: 'white',
        edgeColor: 'gray',
        edgeWidth: 10, // New parameter for edge width
        backgroundColor: '#1a1a1a',
        hoverNodeRadius: 20, // Increased significantly for hover effect
        hoverNodeColor: 'lightblue' // Color for hovered node
    }
};
