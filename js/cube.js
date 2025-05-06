class RubiksCube {
    constructor(size = 3) {
        this.size = size;
        this.cubeSize = 1;
        this.gap = 0.05;
        this.pieceSize = (this.cubeSize - (this.gap * (size - 1))) / size;
        this.pieces = [];
        this.rotationSpeed = 5.0;
        this.rotationGroup = new THREE.Group();
        this.isRotating = false;
        this.rotationAxis = null;
        this.rotationIndex = null;
        this.targetRotation = null;
        this.colors = {
            front: 0xff0000,   // Red
            back: 0xffa500,    // Orange
            up: 0xffffff,      // White
            down: 0xffff00,    // Yellow
            right: 0x00ff00,   // Green
            left: 0x0000ff     // Blue
        };
        
        this.moveQueue = [];
        this.moveHistory = [];
        this.isSolving = false;
        
        // Animation state
        this.rotationProgress = 0;
        this.rotationDuration = 0.15; // Duration of rotation in seconds
        this.useEasing = true; // Enable easing for smoother rotations
        
        // Face highlighter meshes
        this.faceHighlighters = {};
        this.highlightColor = 0xffffff;
        this.highlightOpacity = 0.3;
        this.highlightFace = null;
    }
    
    init(scene) {
        this.scene = scene;
        this.initPieces();
        scene.add(this.rotationGroup);
        this.createFaceHighlighters();
    }
    
    createFaceHighlighters() {
        const faces = ['front', 'back', 'up', 'down', 'right', 'left'];
        const offset = this.cubeSize / 2 + 0.01; // Slightly outside the cube
        const planeSize = this.cubeSize + 0.1; // Slightly larger than the cube
        
        faces.forEach(face => {
            const material = new THREE.MeshBasicMaterial({
                color: this.highlightColor,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
            const plane = new THREE.Mesh(geometry, material);
            
            // Position the plane based on the face
            switch(face) {
                case 'front':
                    plane.position.set(0, 0, offset);
                    break;
                case 'back':
                    plane.position.set(0, 0, -offset);
                    plane.rotation.y = Math.PI;
                    break;
                case 'up':
                    plane.position.set(0, offset, 0);
                    plane.rotation.x = -Math.PI/2;
                    break;
                case 'down':
                    plane.position.set(0, -offset, 0);
                    plane.rotation.x = Math.PI/2;
                    break;
                case 'right':
                    plane.position.set(offset, 0, 0);
                    plane.rotation.y = Math.PI/2;
                    break;
                case 'left':
                    plane.position.set(-offset, 0, 0);
                    plane.rotation.y = -Math.PI/2;
                    break;
            }
            
            this.faceHighlighters[face] = plane;
            this.scene.add(plane);
        });
    }
    
    highlightFaceWithName(faceName) {
        if (this.highlightFace === faceName) return;
        
        // Reset all highlighters
        Object.keys(this.faceHighlighters).forEach(key => {
            this.faceHighlighters[key].material.opacity = 0;
        });
        
        // Highlight the selected face
        if (faceName && this.faceHighlighters[faceName]) {
            this.faceHighlighters[faceName].material.opacity = this.highlightOpacity;
            this.highlightFace = faceName;
        } else {
            this.highlightFace = null;
        }
    }
    
    initPieces() {
        const offset = (this.size - 1) / 2;
        
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    // Skip creating interior pieces
                    if (x !== 0 && x !== this.size - 1 && 
                        y !== 0 && y !== this.size - 1 && 
                        z !== 0 && z !== this.size - 1) {
                        continue;
                    }
                    
                    const piece = this.createPiece(x, y, z);
                    piece.position.set(
                        (x - offset) * (this.pieceSize + this.gap),
                        (y - offset) * (this.pieceSize + this.gap),
                        (z - offset) * (this.pieceSize + this.gap)
                    );
                    
                    piece.userData.originalPosition = {
                        x: x - offset,
                        y: y - offset,
                        z: z - offset
                    };
                    
                    piece.userData.currentPosition = {
                        x: x,
                        y: y,
                        z: z
                    };
                    
                    this.pieces.push(piece);
                    this.scene.add(piece);
                }
            }
        }
    }
    
    createPiece(x, y, z) {
        const geometry = new THREE.BoxGeometry(this.pieceSize, this.pieceSize, this.pieceSize);
        const materials = [];
        const size = this.size - 1;
        
        // Create chamfered cube look with borders
        const createCubieMaterial = (isVisible, color) => {
            if (!isVisible) return new THREE.MeshBasicMaterial({ color: 0x111111 });
            
            // Create canvas for texture
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            // Fill with main color
            ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
            ctx.fillRect(0, 0, 128, 128);
            
            // Add black border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, 120, 120);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            
            return new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xffffff,
                metalness: 0.1,
                roughness: 0.7
            });
        };
        
        // Order: right, left, top, bottom, front, back
        materials.push(createCubieMaterial(x === size, this.colors.right));
        materials.push(createCubieMaterial(x === 0, this.colors.left));
        materials.push(createCubieMaterial(y === size, this.colors.up));
        materials.push(createCubieMaterial(y === 0, this.colors.down));
        materials.push(createCubieMaterial(z === size, this.colors.front));
        materials.push(createCubieMaterial(z === 0, this.colors.back));
        
        const cube = new THREE.Mesh(geometry, materials);
        cube.userData.x = x;
        cube.userData.y = y;
        cube.userData.z = z;
        
        // Add casting and receiving shadows
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        return cube;
    }
    
    createFaceMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.7
        });
    }
    
    rotateFace(face, direction) {
        if (this.isRotating) {
            // Queue the move if already rotating
            this.moveQueue.push({ face, direction });
            return;
        }
        
        this.isRotating = true;
        const axis = this.getFaceAxis(face);
        const index = this.getFaceIndex(face);
        const angle = direction === 'clockwise' ? -Math.PI/2 : Math.PI/2;
        
        // Reset rotation progress
        this.rotationProgress = 0;
        
        this.startRotation(axis, index, angle);
        
        // Highlight the face being rotated
        this.highlightFaceWithName(face);
        
        // Add to move history
        this.moveHistory.push({ face, direction });
        
        // Trigger haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(40);
        }
    }
    
    getFaceAxis(face) {
        switch(face) {
            case 'front':
            case 'back':
                return 'z';
            case 'up':
            case 'down':
                return 'y';
            case 'right':
            case 'left':
                return 'x';
        }
    }
    
    getFaceIndex(face) {
        const lastIndex = this.size - 1;
        switch(face) {
            case 'front': return lastIndex;
            case 'back': return 0;
            case 'up': return lastIndex;
            case 'down': return 0;
            case 'right': return lastIndex;
            case 'left': return 0;
        }
    }
    
    startRotation(axis, layerIndex, targetAngle) {
        this.rotationAxis = axis;
        this.rotationIndex = layerIndex;
        this.targetRotation = targetAngle;
        
        // Add pieces to rotation group
        this.rotationGroup.clear();
        
        // Select pieces based on their current position
        this.pieces.forEach(piece => {
            const pos = piece.userData.currentPosition;
            let shouldRotate = false;
            
            // Check if this piece is in the layer we want to rotate
            if (axis === 'x' && pos.x === layerIndex) {
                shouldRotate = true;
            } else if (axis === 'y' && pos.y === layerIndex) {
                shouldRotate = true;
            } else if (axis === 'z' && pos.z === layerIndex) {
                shouldRotate = true;
            }
            
            if (shouldRotate) {
                // Get the world position before removing from scene
                const worldPos = new THREE.Vector3();
                piece.getWorldPosition(worldPos);
                
                // Remove from scene and add to rotation group
                this.scene.remove(piece);
                this.rotationGroup.add(piece);
                
                // Maintain the same world position
                piece.position.copy(worldPos);
            }
        });
    }
    
    updateRotation(delta) {
        if (!this.isRotating) return;
        
        // Update rotation progress
        this.rotationProgress += delta / this.rotationDuration;
        
        if (this.rotationProgress >= 1) {
            // Complete the rotation
            this.rotationGroup.rotation[this.rotationAxis] = this.targetRotation;
            this.finishRotation();
            return;
        }
        
        // Apply easing for smoother animation
        let t = this.rotationProgress;
        if (this.useEasing) {
            // Cubic easing function
            t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        
        // Update rotation
        this.rotationGroup.rotation[this.rotationAxis] = this.targetRotation * t;
    }
    
    finishRotation() {
        // Update piece positions after rotation
        this.rotationGroup.children.forEach(piece => {
            this.rotationGroup.remove(piece);
            this.scene.add(piece);
            
            // Update current position based on new world position
            const axis = this.rotationAxis;
            const rotAngle = this.rotationGroup.rotation[axis];
            this.updatePiecePosition(piece, axis, rotAngle);
        });
        
        // Reset rotation group
        this.rotationGroup.rotation.set(0, 0, 0);
        this.isRotating = false;
        this.rotationProgress = 0;
        
        // Check for a solved state
        const wasSolved = this.isSolved();
        
        // Process the next move in queue if any
        if (this.moveQueue.length > 0) {
            const nextMove = this.moveQueue.shift();
            this.rotateFace(nextMove.face, nextMove.direction);
        } else {
            // Clear face highlighting if there are no more moves
            this.highlightFaceWithName(null);
            
            // If the cube is solved, trigger a celebration
            if (wasSolved && !this.isSolving) {
                this.celebrateSolve();
            }
        }
    }
    
    celebrateSolve() {
        // Play a sound if available
        if (window.Audio) {
            try {
                const audio = new Audio('https://freesound.org/data/previews/320/320775_274531-lq.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio play error:', e));
            } catch (e) {
                console.log('Audio not supported');
            }
        }
        
        // Trigger longer haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 50, 100]);
        }
    }
    
    updatePiecePosition(piece, axis, angle) {
        // Map new position after rotation
        const roundedAngle = Math.round(angle / (Math.PI/2)) % 4;
        const pos = piece.userData.currentPosition;
        
        if (axis === 'x') {
            if (roundedAngle === 1 || roundedAngle === -3) {
                const oldY = pos.y;
                pos.y = this.size - 1 - pos.z;
                pos.z = oldY;
            } else if (roundedAngle === 2 || roundedAngle === -2) {
                pos.y = this.size - 1 - pos.y;
                pos.z = this.size - 1 - pos.z;
            } else if (roundedAngle === 3 || roundedAngle === -1) {
                const oldY = pos.y;
                pos.y = pos.z;
                pos.z = this.size - 1 - oldY;
            }
        } else if (axis === 'y') {
            if (roundedAngle === 1 || roundedAngle === -3) {
                const oldX = pos.x;
                pos.x = pos.z;
                pos.z = this.size - 1 - oldX;
            } else if (roundedAngle === 2 || roundedAngle === -2) {
                pos.x = this.size - 1 - pos.x;
                pos.z = this.size - 1 - pos.z;
            } else if (roundedAngle === 3 || roundedAngle === -1) {
                const oldX = pos.x;
                pos.x = this.size - 1 - pos.z;
                pos.z = oldX;
            }
        } else if (axis === 'z') {
            if (roundedAngle === 1 || roundedAngle === -3) {
                const oldX = pos.x;
                pos.x = this.size - 1 - pos.y;
                pos.y = oldX;
            } else if (roundedAngle === 2 || roundedAngle === -2) {
                pos.x = this.size - 1 - pos.x;
                pos.y = this.size - 1 - pos.y;
            } else if (roundedAngle === 3 || roundedAngle === -1) {
                const oldX = pos.x;
                pos.x = pos.y;
                pos.y = this.size - 1 - oldX;
            }
        }
    }
    
    scramble(numMoves = 20) {
        const faces = ['front', 'back', 'up', 'down', 'right', 'left'];
        const directions = ['clockwise', 'counterclockwise'];
        
        // Clear any existing movements
        this.moveQueue = [];
        
        for (let i = 0; i < numMoves; i++) {
            const face = faces[Math.floor(Math.random() * faces.length)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            this.moveQueue.push({ face, direction });
        }
        
        // Start the first move if not currently rotating
        if (!this.isRotating && this.moveQueue.length > 0) {
            const nextMove = this.moveQueue.shift();
            this.rotateFace(nextMove.face, nextMove.direction);
        }
    }
    
    reset() {
        // Remove all pieces
        this.pieces.forEach(piece => {
            this.scene.remove(piece);
        });
        
        this.rotationGroup.clear();
        this.pieces = [];
        this.moveQueue = [];
        this.moveHistory = [];
        this.isRotating = false;
        
        // Clear face highlighting
        this.highlightFaceWithName(null);
        
        // Reinitialize the cube
        this.initPieces();
    }
    
    isSolved() {
        // Check if all faces have the same color
        const faceChecks = [
            { axis: 'x', value: 0, color: this.colors.left },
            { axis: 'x', value: this.size - 1, color: this.colors.right },
            { axis: 'y', value: 0, color: this.colors.down },
            { axis: 'y', value: this.size - 1, color: this.colors.up },
            { axis: 'z', value: 0, color: this.colors.back },
            { axis: 'z', value: this.size - 1, color: this.colors.front }
        ];
        
        for (const check of faceChecks) {
            const faceColor = this.getFaceColor(check.axis, check.value);
            if (faceColor !== check.color) {
                return false;
            }
        }
        
        return true;
    }
    
    getFaceColor(axis, value) {
        // This is a simplified version, would need more complex logic for a real implementation
        return this.colors[this.getFaceByAxisValue(axis, value)];
    }
    
    getFaceByAxisValue(axis, value) {
        if (axis === 'x') {
            return value === 0 ? 'left' : 'right';
        } else if (axis === 'y') {
            return value === 0 ? 'down' : 'up';
        } else {
            return value === 0 ? 'back' : 'front';
        }
    }
    
    solve() {
        // In a real implementation, this would use a solving algorithm
        // For demo purposes, we'll just reverse the move history
        if (this.moveHistory.length === 0 || this.isSolving) return;
        
        this.isSolving = true;
        const reversedMoves = [...this.moveHistory].reverse().map(move => ({
            face: move.face,
            direction: move.direction === 'clockwise' ? 'counterclockwise' : 'clockwise'
        }));
        
        // Clear the current queue and add the solution moves
        this.moveQueue = reversedMoves;
        
        // Start the first move if not currently rotating
        if (!this.isRotating && this.moveQueue.length > 0) {
            const nextMove = this.moveQueue.shift();
            this.rotateFace(nextMove.face, nextMove.direction);
        }
        
        // Clear the move history since we're solving
        this.moveHistory = [];
    }
} 
