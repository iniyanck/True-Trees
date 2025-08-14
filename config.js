const config = {
    tree: {
        maxDepth: 7,
        branchingFactor: 2,
        padding: 50,
        radialSpacing: 100 // New parameter for concentric circle spacing
    },
    forces: {
        edgeLength: 80,
        repulsionStrength: 1000,
        attractionStrength: 0.05, // Increased for stronger pull
        dampingFactor: 0.8 // Increased to reduce oscillations
    },
    appearance: {
        nodeRadius: 15, // Increased significantly for easier clicking
        nodeColor: 'white',
        edgeColor: 'gray',
        backgroundColor: '#1a1a1a',
        hoverNodeRadius: 30, // Increased significantly for hover effect
        hoverNodeColor: 'lightblue' // Color for hovered node
    }
};
