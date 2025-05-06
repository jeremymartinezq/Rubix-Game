class CubeControls {
    constructor(cube, camera, renderer) {
        this.cube = cube;
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedPiece = null;
        this.startPoint = new THREE.Vector2();
        this.lastPoint = new THREE.Vector2();
        this.startTime = 0;
        this.hoverFace = null;
        
        try {
            this.orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            this.orbitControls.enableDamping = true;
            this.orbitControls.dampingFactor = 0.05;
            this.orbitControls.rotateSpeed = 1.5;
            this.orbitControls.enablePan = false;
            this.orbitControls.minDistance = 4;
            this.orbitControls.maxDistance = 10;
            this.orbitControls.enabled = false; // Start with orbit controls disabled
        } catch (error) {
            console.error("Error initializing OrbitControls:", error);
        }
        
        this.dragMode = false;
        this.touchStartTime = 0;
        this.rotationDelta = 5; // Further reduced for more responsive rotations
        this.longPressTime = 300; // Time in ms to trigger orbit controls
        
        this.gameStarted = false;
        this.timerInterval = null;
        this.startTime = null;
        this.timerDisplay = document.getElementById('timer');
        
        // Auto-rotation when not interacting
        this.autoRotate = true;
        this.autoRotateSpeed = 0.5;
        this.lastInteractionTime = Date.now();
        this.interactionTimeout = 5000; // Start auto-rotating after 5 seconds of inactivity
        
        // Show hints for new users
        this.showHints = true;
        this.hintElement = null;
        
        this.initializeControls();
        this.initializeButtons();
        this.createHintElement();
        
        console.log('Controls initialized');
    }
    
    createHintElement() {
        this.hintElement = document.createElement('div');
        this.hintElement.className = 'control-hint';
        this.hintElement.style.position = 'absolute';
        this.hintElement.style.bottom = '120px';
        this.hintElement.style.left = '50%';
        this.hintElement.style.transform = 'translateX(-50%)';
        this.hintElement.style.background = 'rgba(0,0,0,0.7)';
        this.hintElement.style.color = 'white';
        this.hintElement.style.padding = '10px 15px';
        this.hintElement.style.borderRadius = '5px';
        this.hintElement.style.fontSize = '14px';
        this.hintElement.style.pointerEvents = 'none';
        this.hintElement.style.transition = 'opacity 0.3s';
        this.hintElement.style.opacity = '0';
        this.hintElement.style.zIndex = '1000';
        this.hintElement.textContent = 'Click and drag a face to rotate';
        
        document.body.appendChild(this.hintElement);
        
        // Show hint after a short delay
        setTimeout(() => {
            if (this.showHints) {
                this.hintElement.style.opacity = '1';
                // Hide after 5 seconds
                setTimeout(() => {
                    this.hintElement.style.opacity = '0';
                }, 5000);
            }
        }, 1500);
    }
    
    initializeControls() {
        try {
            const domElement = this.renderer.domElement;
            
            // Mouse controls
            domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
            domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
            window.addEventListener('mouseup', this.onMouseUp.bind(this));
            
            // Touch controls
            domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
            domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
            window.addEventListener('touchend', this.onTouchEnd.bind(this));
            
            // Keyboard controls
            window.addEventListener('keydown', this.onKeyDown.bind(this));
            
            // Mouse wheel for zoom
            domElement.addEventListener('wheel', this.onWheel.bind(this));
            
            // Prevent default behaviors that might interfere
            domElement.addEventListener('dragstart', e => e.preventDefault());
            
            // Double click to reset camera view
            domElement.addEventListener('dblclick', this.resetCameraView.bind(this));
            
            console.log('Event listeners added');
        } catch (error) {
            console.error("Error setting up control event listeners:", error);
        }
    }
    
    resetCameraView() {
        // Animate camera back to default position
        const startPosition = this.camera.position.clone();
        const targetPosition = new THREE.Vector3(5, 5, 5);
        const duration = 1000; // ms
        const startTime = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            if (elapsed >= duration) {
                this.camera.position.copy(targetPosition);
                this.camera.lookAt(0, 0, 0);
                return;
            }
            
            const t = elapsed / duration;
            // Ease out cubic
            const factor = 1 - Math.pow(1 - t, 3);
            
            this.camera.position.lerpVectors(startPosition, targetPosition, factor);
            this.camera.lookAt(0, 0, 0);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    onWheel(event) {
        // Update last interaction time
        this.lastInteractionTime = Date.now();
        
        // If orbit controls are not enabled but the user is holding Ctrl,
        // temporarily enable them for zooming
        if (!this.orbitControls.enabled && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            const prevEnabled = this.orbitControls.enabled;
            this.orbitControls.enabled = true;
            this.orbitControls.handleMouseWheel(event);
            this.orbitControls.enabled = prevEnabled;
        }
    }
    
    initializeButtons() {
        try {
            const scrambleBtn = document.getElementById('scramble-btn');
            const resetBtn = document.getElementById('reset-btn');
            const solveBtn = document.getElementById('solve-btn');
            
            if (scrambleBtn) {
                scrambleBtn.addEventListener('click', () => {
                    this.cube.scramble();
                    this.startTimer();
                    
                    // Provide haptic feedback
                    if (window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50);
                    }
                    
                    // Update hint
                    this.showHint('Try to solve the cube!');
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.cube.reset();
                    this.stopTimer();
                    
                    // Provide haptic feedback
                    if (window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50);
                    }
                    
                    // Update hint
                    this.showHint('Cube reset to solved state');
                });
            }
            
            if (solveBtn) {
                solveBtn.addEventListener('click', () => {
                    this.cube.solve();
                    this.stopTimer();
                    
                    // Provide haptic feedback
                    if (window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50);
                    }
                    
                    // Update hint
                    this.showHint('Watch the cube solve itself!');
                });
            }
            
            console.log('Buttons initialized');
        } catch (error) {
            console.error("Error setting up button controls:", error);
        }
    }
    
    showHint(text) {
        if (!this.showHints || !this.hintElement) return;
        
        this.hintElement.textContent = text;
        this.hintElement.style.opacity = '1';
        
        // Hide after 3 seconds
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            this.hintElement.style.opacity = '0';
        }, 3000);
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.gameStarted = true;
        this.startTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - this.startTime;
            this.updateTimerDisplay(elapsedTime);
        }, 100);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.gameStarted = false;
        this.updateTimerDisplay(0);
    }
    
    updateTimerDisplay(timeMs) {
        if (!this.timerDisplay) return;
        
        const seconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        this.timerDisplay.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    onMouseDown(event) {
        this.lastInteractionTime = Date.now();
        
        // Hide any visible hints
        if (this.hintElement) {
            this.hintElement.style.opacity = '0';
        }
        
        event.preventDefault();
        
        // Right-click or ctrl+click activates orbit controls
        if (event.button === 2 || event.ctrlKey) {
            this.orbitControls.enabled = true;
            return;
        }
        
        // Otherwise, try to select a piece
        this.orbitControls.enabled = false;
        this.updateMousePosition(event);
        this.startPoint.set(event.clientX, event.clientY);
        this.lastPoint.copy(this.startPoint);
        this.startTime = Date.now();
        this.checkIntersection();
    }
    
    onMouseMove(event) {
        this.lastInteractionTime = Date.now();
        
        // Always update mouse position for hover effects
        this.updateMousePosition(event);
        
        // Check for hovering over a face when not dragging
        if (!this.dragMode && !this.orbitControls.enabled) {
            this.checkHover();
        }
        
        if (this.selectedPiece && !this.orbitControls.enabled) {
            const currentPoint = new THREE.Vector2(event.clientX, event.clientY);
            
            // Update velocity for drag momentum
            const deltaTime = (Date.now() - this.startTime) / 1000;
            if (deltaTime > 0) {
                this.dragVelocity = {
                    x: (currentPoint.x - this.lastPoint.x) / deltaTime,
                    y: (currentPoint.y - this.lastPoint.y) / deltaTime
                };
                this.lastPoint.copy(currentPoint);
                this.startTime = Date.now();
            }
            
            this.handleDrag(currentPoint);
        }
    }
    
    checkHover() {
        try {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.cube.pieces);
            
            if (intersects.length > 0) {
                // Determine which face was hovered based on intersection normal
                const intersect = intersects[0];
                const piece = intersect.object;
                const faceIndex = intersect.faceIndex;
                
                // Map face index to cube face (0=right, 1=left, 2=top, 3=bottom, 4=front, 5=back)
                const faceMap = ['right', 'left', 'up', 'down', 'front', 'back'];
                const cubeFaceIndex = Math.floor(faceIndex / 2);
                const face = faceMap[cubeFaceIndex];
                
                // Highlight the face
                if (this.hoverFace !== face) {
                    this.hoverFace = face;
                    this.cube.highlightFaceWithName(face);
                }
            } else {
                // No intersection, clear highlight
                if (this.hoverFace) {
                    this.hoverFace = null;
                    this.cube.highlightFaceWithName(null);
                }
            }
        } catch (error) {
            console.error("Error checking hover:", error);
        }
    }
    
    onMouseUp(event) {
        this.selectedPiece = null;
        this.dragMode = false;
        
        // Apply momentum if we have drag velocity
        if (this.dragVelocity && this.hoverFace && 
            (Math.abs(this.dragVelocity.x) > 800 || Math.abs(this.dragVelocity.y) > 800)) {
            
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const isDragHorizontal = Math.abs(this.dragVelocity.x) > Math.abs(this.dragVelocity.y);
            const isPositiveDrag = isDragHorizontal ? this.dragVelocity.x > 0 : this.dragVelocity.y > 0;
            
            // Use the determined face from hover and calculate direction
            const direction = this.determineDirectionFromDrag(this.hoverFace, isDragHorizontal, isPositiveDrag, cameraDirection);
            
            if (direction) {
                this.cube.rotateFace(this.hoverFace, direction);
                if (!this.gameStarted) {
                    this.startTimer();
                }
            }
        }
        
        this.dragVelocity = null;
    }
    
    determineDirectionFromDrag(face, isDragHorizontal, isPositiveDrag, cameraDir) {
        // This is a simplified direction determination based on the face, camera angle, and drag direction
        const absX = Math.abs(cameraDir.x);
        const absY = Math.abs(cameraDir.y);
        const absZ = Math.abs(cameraDir.z);
        
        // For each face, determine clockwise or counterclockwise based on drag direction
        // This is simplified and would need refinement for a more intuitive feeling
        const directionMap = {
            'front': isDragHorizontal ? 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise') : 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise'),
            'back': isDragHorizontal ? 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise') : 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise'),
            'up': isDragHorizontal ? 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise') : 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise'),
            'down': isDragHorizontal ? 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise') : 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise'),
            'right': isDragHorizontal ? 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise') : 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise'),
            'left': isDragHorizontal ? 
                (isPositiveDrag ? 'clockwise' : 'counterclockwise') : 
                (isPositiveDrag ? 'counterclockwise' : 'clockwise')
        };
        
        return directionMap[face];
    }
    
    onTouchStart(event) {
        this.lastInteractionTime = Date.now();
        
        // Hide any visible hints
        if (this.hintElement) {
            this.hintElement.style.opacity = '0';
        }
        
        event.preventDefault(); // Prevent scrolling
        
        // Long press will activate orbit controls
        this.touchStartTime = Date.now();
        
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.updateMousePosition(touch);
            this.startPoint.set(touch.clientX, touch.clientY);
            this.lastPoint.copy(this.startPoint);
            this.startTime = Date.now();
            this.checkIntersection();
            this.orbitControls.enabled = false;
            
            // Check for hover
            this.checkHover();
        } else if (event.touches.length === 2) {
            // Multi-touch always activates orbit controls
            this.orbitControls.enabled = true;
            this.selectedPiece = null;
        }
    }
    
    onTouchMove(event) {
        this.lastInteractionTime = Date.now();
        
        event.preventDefault(); // Prevent scrolling
        
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.updateMousePosition(touch);
            const currentTime = Date.now();
            
            // Check for long press to activate orbit controls
            if (!this.dragMode && currentTime - this.touchStartTime > this.longPressTime) {
                this.orbitControls.enabled = true;
                this.selectedPiece = null;
                
                // Show hint for first-time users
                this.showHint('Use two fingers to zoom, drag to orbit');
                
                return;
            }
            
            if (this.selectedPiece && !this.orbitControls.enabled) {
                const currentPoint = new THREE.Vector2(touch.clientX, touch.clientY);
                
                // Update velocity for drag momentum
                const deltaTime = (currentTime - this.startTime) / 1000;
                if (deltaTime > 0) {
                    this.dragVelocity = {
                        x: (currentPoint.x - this.lastPoint.x) / deltaTime,
                        y: (currentPoint.y - this.lastPoint.y) / deltaTime
                    };
                    this.lastPoint.copy(currentPoint);
                    this.startTime = currentTime;
                }
                
                this.handleDrag(currentPoint);
            }
        }
    }
    
    onTouchEnd(event) {
        // Similar logic to mouseUp for momentum
        if (this.dragVelocity && this.hoverFace && 
            (Math.abs(this.dragVelocity.x) > 500 || Math.abs(this.dragVelocity.y) > 500)) {
            
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const isDragHorizontal = Math.abs(this.dragVelocity.x) > Math.abs(this.dragVelocity.y);
            const isPositiveDrag = isDragHorizontal ? this.dragVelocity.x > 0 : this.dragVelocity.y > 0;
            
            const direction = this.determineDirectionFromDrag(this.hoverFace, isDragHorizontal, isPositiveDrag, cameraDirection);
            
            if (direction) {
                this.cube.rotateFace(this.hoverFace, direction);
                if (!this.gameStarted) {
                    this.startTimer();
                }
            }
        }
        
        this.selectedPiece = null;
        this.dragMode = false;
        this.dragVelocity = null;
    }
    
    onKeyDown(event) {
        this.lastInteractionTime = Date.now();
        
        // Add keyboard controls for rotating faces
        const key = event.key.toLowerCase();
        const shift = event.shiftKey;
        
        const keyMap = {
            'f': { face: 'front', direction: shift ? 'counterclockwise' : 'clockwise' },
            'b': { face: 'back', direction: shift ? 'counterclockwise' : 'clockwise' },
            'u': { face: 'up', direction: shift ? 'counterclockwise' : 'clockwise' },
            'd': { face: 'down', direction: shift ? 'counterclockwise' : 'clockwise' },
            'r': { face: 'right', direction: shift ? 'counterclockwise' : 'clockwise' },
            'l': { face: 'left', direction: shift ? 'counterclockwise' : 'clockwise' }
        };
        
        if (keyMap[key]) {
            // Highlight the face first
            this.cube.highlightFaceWithName(keyMap[key].face);
            
            // Slight delay before rotation for visual feedback
            setTimeout(() => {
                this.cube.rotateFace(keyMap[key].face, keyMap[key].direction);
                if (!this.gameStarted) {
                    this.startTimer();
                }
            }, 50);
        }
        
        // Spacebar for scrambling
        if (key === ' ') {
            this.cube.scramble();
            this.startTimer();
            
            // Show hint
            this.showHint('Cube scrambled! Try to solve it.');
            
            // Provide haptic feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(100);
            }
        }
        
        // R key to reset camera view
        if (key === 'v') {
            this.resetCameraView();
        }
        
        // H key to toggle hints
        if (key === 'h') {
            this.showHints = !this.showHints;
            this.showHint(this.showHints ? 'Hints enabled' : 'Hints disabled');
        }
    }
    
    updateMousePosition(event) {
        try {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        } catch (error) {
            console.error("Error updating mouse position:", error);
        }
    }
    
    checkIntersection() {
        try {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.cube.pieces);
            
            if (intersects.length > 0) {
                this.selectedPiece = intersects[0].object;
                
                // Determine which face was clicked
                const intersect = intersects[0];
                const faceIndex = intersect.faceIndex;
                
                // Map face index to cube face
                const faceMap = ['right', 'left', 'up', 'down', 'front', 'back'];
                const cubeFaceIndex = Math.floor(faceIndex / 2);
                this.hoverFace = faceMap[cubeFaceIndex];
                
                // Highlight the face
                this.cube.highlightFaceWithName(this.hoverFace);
            }
        } catch (error) {
            console.error("Error checking intersection:", error);
        }
    }
    
    handleDrag(currentPoint) {
        try {
            const deltaX = currentPoint.x - this.startPoint.x;
            const deltaY = currentPoint.y - this.startPoint.y;
            
            // Only start drag mode if we've moved enough
            if (!this.dragMode && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                this.dragMode = true;
            }
            
            if (this.dragMode && 
               (Math.abs(deltaX) > this.rotationDelta || Math.abs(deltaY) > this.rotationDelta)) {
                
                // Determine which face to rotate based on camera angle and drag direction
                const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                
                // Use the hover face to determine which face to rotate
                if (this.hoverFace) {
                    const isDragHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
                    const isPositiveDrag = isDragHorizontal ? deltaX > 0 : deltaY > 0;
                    
                    const direction = this.determineDirectionFromDrag(
                        this.hoverFace, isDragHorizontal, isPositiveDrag, cameraDirection
                    );
                    
                    if (direction) {
                        if (!this.gameStarted) {
                            this.startTimer();
                        }
                        
                        this.cube.rotateFace(this.hoverFace, direction);
                        this.selectedPiece = null;
                        this.dragMode = false;
                        
                        // Reset start point for next drag
                        this.startPoint.set(currentPoint.x, currentPoint.y);
                    }
                }
            }
        } catch (error) {
            console.error("Error handling drag:", error);
        }
    }
    
    update(delta) {
        try {
            // Update orbit controls
            if (this.orbitControls && this.orbitControls.enabled) {
                this.orbitControls.update();
            }
            
            // Handle auto rotation when not interacting
            if (this.autoRotate && !this.cube.isRotating && !this.orbitControls.enabled) {
                const now = Date.now();
                if (now - this.lastInteractionTime > this.interactionTimeout) {
                    // Rotate the entire scene slowly
                    this.cube.scene.rotation.y += delta * this.autoRotateSpeed * 0.5;
                }
            }
            
            // Check if cube is solved
            if (this.gameStarted && this.cube.isSolved()) {
                this.stopTimer();
                
                // Don't repeatedly show alert
                if (this.gameStarted) {
                    this.showHint('Congratulations! You solved the cube!');
                    
                    // Show the full alert only once
                    setTimeout(() => {
                        alert('Congratulations! You solved the cube!');
                    }, 500);
                    
                    this.gameStarted = false;
                }
            }
        } catch (error) {
            console.error("Error in controls update:", error);
        }
    }
} 
