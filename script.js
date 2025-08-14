const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.style.backgroundColor = config.appearance.backgroundColor;

let nodes = [];
let edges = [];
const EDGE_LENGTH = config.forces.edgeLength;
const REPULSION_STRENGTH = config.forces.repulsionStrength;
const ATTRACTION_STRENGTH = config.forces.attractionStrength;
const DAMPING_FACTOR = config.forces.dampingFactor;

let scale = 1;
let translateX = 0;
let translateY = 0;

let isDragging = false;
let draggedNodeId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let hoveredNodeId = null; // New variable to track hovered node

class Node {
    constructor(id, x, y, depth, parentId = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.fx = 0; // Force x
        this.fy = 0; // Force y
        this.depth = depth;
        this.parentId = parentId; // Store parent ID
        this.children = []; // Store children IDs
    }

    draw() {
        ctx.beginPath();
        // Draw a larger circle for hovered/dragged nodes
        if (this.id === hoveredNodeId || this.id === draggedNodeId) {
            ctx.arc(this.x, this.y, config.appearance.hoverNodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = config.appearance.hoverNodeColor;
        } else {
            ctx.arc(this.x, this.y, config.appearance.nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = config.appearance.nodeColor;
        }
        ctx.fill();
    }
}

function createTree(depth, parent = null, parentId = null, currentDepth = 0) {
    if (currentDepth > depth) {
        return;
    }

    const nodeId = nodes.length;
    // Initial random placement, will be overridden by initializeConcentricLayout
    const node = new Node(nodeId, canvas.width / 2 + (Math.random() - 0.5) * 100, canvas.height / 2 + (Math.random() - 0.5) * 100, currentDepth, parentId);
    nodes.push(node);

    if (parent) {
        edges.push({ from: parentId, to: nodeId });
        nodes[parentId].children.push(nodeId); // Add child to parent's children list
    }

    const branchingFactor = config.tree.branchingFactor; 
    for (let i = 0; i < branchingFactor; i++) {
        createTree(depth, node, nodeId, currentDepth + 1);
    }
}

function calculateForces() {
    // Reset forces for non-dragged nodes
    nodes.forEach(node => {
        if (node.id !== draggedNodeId) {
            node.fx = 0;
            node.fy = 0;
        }
    });

    // Repulsion forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];

            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Calculate graph distance (shortest path)
                const graphDist = getGraphDistance(nodeA.id, nodeB.id);
                const repulsionFactor = REPULSION_STRENGTH / (dist * dist) * (graphDist + 1); // Higher repulsion for greater graph distance

                const fx = (dx / dist) * repulsionFactor;
                const fy = (dy / dist) * repulsionFactor;

                if (nodeA.id !== draggedNodeId) {
                    nodeA.fx -= fx;
                    nodeA.fy -= fy;
                }
                if (nodeB.id !== draggedNodeId) {
                    nodeB.fx += fx;
                    nodeB.fy += fy;
                }
            }
        }
    }

    // Attraction forces for edges (fixed length)
    edges.forEach(edge => {
        const nodeA = nodes[edge.from];
        const nodeB = nodes[edge.to];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const displacement = dist - EDGE_LENGTH;
        const attraction = ATTRACTION_STRENGTH * displacement;

        const fx = (dx / dist) * attraction;
        const fy = (dy / dist) * attraction;

        if (nodeA.id !== draggedNodeId) {
            nodeA.fx += fx;
            nodeA.fy += fy;
        }
        if (nodeB.id !== draggedNodeId) {
            nodeB.fx -= fx;
            nodeB.fy -= fy;
        }
    });
}

// Helper to get all ancestors of a node up to the root
function getAncestors(nodeId) {
    const ancestors = [];
    let currentNode = nodes[nodeId];
    while (currentNode) {
        ancestors.push(currentNode.id);
        if (currentNode.parentId !== null) {
            currentNode = nodes[currentNode.parentId];
        } else {
            currentNode = null; // Reached root
        }
    }
    return ancestors.reverse(); // From root to node
}

// Find the Lowest Common Ancestor (LCA) of two nodes
function findLCA(nodeId1, nodeId2) {
    const path1 = getAncestors(nodeId1);
    const path2 = getAncestors(nodeId2);

    let lca = null;
    let i = 0;
    while (i < path1.length && i < path2.length && path1[i] === path2[i]) {
        lca = path1[i];
        i++;
    }
    return lca;
}

// Optimized function to find shortest path (graph distance) using LCA
function getGraphDistance(nodeId1, nodeId2) {
    if (nodeId1 === nodeId2) return 0;

    const nodeA = nodes[nodeId1];
    const nodeB = nodes[nodeId2];

    const lcaId = findLCA(nodeId1, nodeId2);
    const lcaNode = nodes[lcaId];

    // Distance from node to LCA
    const distA_LCA = nodeA.depth - lcaNode.depth;
    const distB_LCA = nodeB.depth - lcaNode.depth;

    return distA_LCA + distB_LCA;
}


function updateNodePositions() {
    nodes.forEach(node => {
        if (node.id !== draggedNodeId) { // Only update position if not being dragged
            node.vx = (node.vx + node.fx) * DAMPING_FACTOR;
            node.vy = (node.vy + node.fy) * DAMPING_FACTOR;

            node.x += node.vx;
            node.y += node.vy;
        } else {
            // If dragged, ensure velocity is zero to prevent interference
            node.vx = 0;
            node.vy = 0;
        }
    });
}

function updateViewTransform() {
    if (nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
    });

    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;

    const padding = config.tree.padding; // Padding around the tree
    const targetWidth = canvas.width - padding * 2;
    const targetHeight = canvas.height - padding * 2;

    let newScale = 1;
    if (treeWidth > 0 && treeHeight > 0) {
        newScale = Math.min(targetWidth / treeWidth, targetHeight / treeHeight);
    }
    scale = Math.min(newScale, 1); // Don't zoom in beyond 100% if tree is small

    // Translate to center the tree, considering the root node
    const rootNode = nodes[0]; // Assuming the first node created is the root
    if (rootNode) {
        translateX = canvas.width / 2 - (rootNode.x * scale);
        translateY = canvas.height / 2 - (rootNode.y * scale);
    } else {
        translateX = canvas.width / 2;
        translateY = canvas.height / 2;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);

    edges.forEach(edge => {
        const nodeA = nodes[edge.from];
        const nodeB = nodes[edge.to];
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.strokeStyle = config.appearance.edgeColor;
        ctx.stroke();
    });

    nodes.forEach(node => node.draw());
    ctx.restore();

    // Update cursor style
    if (hoveredNodeId !== null) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
}

function animate() {
    calculateForces();
    updateNodePositions();
    updateViewTransform(); // Update scale and translation
    draw();
    requestAnimationFrame(animate);
}

function initializeConcentricLayout() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Group nodes by depth
    const nodesByDepth = new Map();
    nodes.forEach(node => {
        if (!nodesByDepth.has(node.depth)) {
            nodesByDepth.set(node.depth, []);
        }
        nodesByDepth.get(node.depth).push(node);
    });

    // Position nodes
    nodesByDepth.forEach((nodesAtDepth, depth) => {
        if (depth === 0) {
            // Root node at the center
            nodesAtDepth[0].x = centerX;
            nodesAtDepth[0].y = centerY;
        } else {
            const radius = depth * config.tree.radialSpacing;
            const numNodes = nodesAtDepth.length;
            const angleStep = (Math.PI * 2) / numNodes;

            nodesAtDepth.forEach((node, index) => {
                const angle = index * angleStep;
                node.x = centerX + radius * Math.cos(angle);
                node.y = centerY + radius * Math.sin(angle);
            });
        }
    });
}

createTree(config.tree.maxDepth);
initializeConcentricLayout(); // Call after tree structure is created
animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Re-center nodes or adjust positions if needed on resize
});

// Mouse interaction for dragging nodes
canvas.addEventListener('mousedown', (e) => {
    // Convert mouse coordinates to world coordinates
    const mouseX = (e.clientX - translateX) / scale;
    const mouseY = (e.clientY - translateY) / scale;

    for (let i = nodes.length - 1; i >= 0; i--) { // Iterate backwards to pick top-most node
        const node = nodes[i];
        const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
        // Use hoverNodeRadius for hit detection to match visual hover feedback
        if (dist < config.appearance.hoverNodeRadius) {
            isDragging = true;
            draggedNodeId = node.id;
            dragOffsetX = mouseX - node.x;
            dragOffsetY = mouseY - node.y;
            // Stop node movement immediately when dragged
            node.vx = 0;
            node.vy = 0;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    // Convert mouse coordinates to world coordinates
    const mouseX = (e.clientX - translateX) / scale;
    const mouseY = (e.clientY - translateY) / scale;

    let foundNode = false;
    if (!isDragging) { // Only update hoveredNodeId if not currently dragging
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
            // Use hoverNodeRadius for hit detection for hover effect
            if (dist < config.appearance.hoverNodeRadius) {
                if (hoveredNodeId !== node.id) {
                    hoveredNodeId = node.id;
                    // Request redraw to show hover effect immediately
                    draw();
                }
                foundNode = true;
                break;
            }
        }
        if (!foundNode && hoveredNodeId !== null) {
            hoveredNodeId = null;
            // Request redraw to remove hover effect immediately
            draw();
        }
    }

    if (isDragging && draggedNodeId !== null) {
        const draggedNode = nodes[draggedNodeId];
        draggedNode.x = mouseX - dragOffsetX;
        draggedNode.y = mouseY - dragOffsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    draggedNodeId = null;
});

canvas.addEventListener('mouseleave', () => {
    // If mouse leaves canvas, stop dragging and clear hover
    isDragging = false;
    draggedNodeId = null;
    if (hoveredNodeId !== null) {
        hoveredNodeId = null;
        draw(); // Redraw to remove hover effect
    }
});
