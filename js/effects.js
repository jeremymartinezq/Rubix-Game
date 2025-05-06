// Visual effects for the Rubik's Cube game
class CubeEffects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.sparkles = [];
        this.confetti = [];
        
        // Set up particle system
        this.particleSystem = this.createParticleSystem();
        this.scene.add(this.particleSystem);
        
        // Create sparkle and confetti systems
        this.sparkleSystem = this.createSparkleSystem();
        this.confettiSystem = this.createConfettiSystem();
        this.scene.add(this.sparkleSystem);
        this.scene.add(this.confettiSystem);
    }
    
    createParticleSystem() {
        const particleCount = 300; // Reduced for better performance
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Position
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Color - choose from cube colors
            const colorIndex = Math.floor(Math.random() * 6);
            const cubeColors = [0xff0000, 0xffa500, 0xffffff, 0xffff00, 0x00ff00, 0x0000ff];
            color.setHex(cubeColors[colorIndex]);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size
            sizes[i] = Math.random() * 0.05 + 0.01;
            
            // Save particle data for animation
            this.particles.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.02,
                vz: (Math.random() - 0.5) * 0.02,
                size: sizes[i]
            });
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create material
        const particleTexture = this.createCircleTexture();
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            map: particleTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        return new THREE.Points(particles, material);
    }
    
    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createSparkleSystem() {
        const sparkleCount = 60; // Reduced for better performance
        const sparkles = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkleCount * 3);
        const colors = new Float32Array(sparkleCount * 3);
        const sizes = new Float32Array(sparkleCount);
        
        for (let i = 0; i < sparkleCount; i++) {
            // Position - initially off screen
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            // Color - white/yellow
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = Math.random() * 0.5 + 0.5;
            
            // Size
            sizes[i] = 0;
            
            // Save sparkle data
            this.sparkles.push({
                active: false,
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                size: 0,
                life: 0,
                maxLife: 0
            });
        }
        
        sparkles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sparkles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        sparkles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create sparkle texture
        const sparkleTexture = this.createSparkleTexture();
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            map: sparkleTexture,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        return new THREE.Points(sparkles, material);
    }
    
    createSparkleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 200, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createConfettiSystem() {
        const confettiCount = 100; // Reduced for better performance
        const confetti = new THREE.BufferGeometry();
        const positions = new Float32Array(confettiCount * 3);
        const colors = new Float32Array(confettiCount * 3);
        const sizes = new Float32Array(confettiCount);
        
        for (let i = 0; i < confettiCount; i++) {
            // Position - initially off screen
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            // Color - random vibrant colors
            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
            
            // Size
            sizes[i] = 0;
            
            // Save confetti data
            this.confetti.push({
                active: false,
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                ax: 0, ay: 0, az: 0,
                size: 0,
                life: 0,
                maxLife: 0,
                rotation: 0,
                rotationSpeed: 0
            });
        }
        
        confetti.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        confetti.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        confetti.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create confetti texture
        const confettiTexture = this.createConfettiTexture();
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            map: confettiTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        
        return new THREE.Points(confetti, material);
    }
    
    createConfettiTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 16, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createSparkles(position, count = 10) {
        for (let i = 0; i < this.sparkles.length && count > 0; i++) {
            if (!this.sparkles[i].active) {
                const sparkle = this.sparkles[i];
                sparkle.active = true;
                sparkle.x = position.x + (Math.random() - 0.5) * 0.2;
                sparkle.y = position.y + (Math.random() - 0.5) * 0.2;
                sparkle.z = position.z + (Math.random() - 0.5) * 0.2;
                
                sparkle.vx = (Math.random() - 0.5) * 0.05;
                sparkle.vy = (Math.random() - 0.5) * 0.05 + 0.03; // Bias upward
                sparkle.vz = (Math.random() - 0.5) * 0.05;
                
                sparkle.size = Math.random() * 0.08 + 0.02;
                sparkle.life = 0;
                sparkle.maxLife = Math.random() * 30 + 30;
                
                count--;
            }
        }
    }
    
    createVictoryEffect() {
        // Spawn confetti from the top
        for (let i = 0; i < this.confetti.length; i++) {
            const confetti = this.confetti[i];
            confetti.active = true;
            
            // Spawn above the cube
            confetti.x = (Math.random() - 0.5) * 3;
            confetti.y = 5;
            confetti.z = (Math.random() - 0.5) * 3;
            
            // Random velocity, mainly downward
            confetti.vx = (Math.random() - 0.5) * 0.03;
            confetti.vy = -Math.random() * 0.05 - 0.01;
            confetti.vz = (Math.random() - 0.5) * 0.03;
            
            // Add some spin and acceleration
            confetti.ax = 0;
            confetti.ay = -0.0001; // Gravity
            confetti.az = 0;
            
            confetti.size = Math.random() * 0.1 + 0.05;
            confetti.life = 0;
            confetti.maxLife = Math.random() * 200 + 200;
            
            confetti.rotation = Math.random() * Math.PI * 2;
            confetti.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }
    }
    
    update(delta) {
        try {
            // Update particles
            if (this.particleSystem && this.particleSystem.geometry) {
                const positions = this.particleSystem.geometry.attributes.position.array;
                const sizes = this.particleSystem.geometry.attributes.size.array;
                
                for (let i = 0; i < this.particles.length; i++) {
                    const particle = this.particles[i];
                    
                    // Update position
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.z += particle.vz;
                    
                    // Boundary check and bounce
                    if (Math.abs(particle.x) > 10) {
                        particle.vx *= -1;
                    }
                    if (Math.abs(particle.y) > 10) {
                        particle.vy *= -1;
                    }
                    if (Math.abs(particle.z) > 10) {
                        particle.vz *= -1;
                    }
                    
                    // Update buffer
                    positions[i * 3] = particle.x;
                    positions[i * 3 + 1] = particle.y;
                    positions[i * 3 + 2] = particle.z;
                    
                    // Pulsating size
                    sizes[i] = particle.size * (0.8 + 0.2 * Math.sin(Date.now() * 0.003 + i));
                }
                
                this.particleSystem.geometry.attributes.position.needsUpdate = true;
                this.particleSystem.geometry.attributes.size.needsUpdate = true;
            }
            
            // Update sparkles
            if (this.sparkleSystem && this.sparkleSystem.geometry) {
                const sparklePositions = this.sparkleSystem.geometry.attributes.position.array;
                const sparkleSizes = this.sparkleSystem.geometry.attributes.size.array;
                
                for (let i = 0; i < this.sparkles.length; i++) {
                    const sparkle = this.sparkles[i];
                    
                    if (sparkle.active) {
                        // Update life
                        sparkle.life += delta * 60;
                        
                        if (sparkle.life >= sparkle.maxLife) {
                            sparkle.active = false;
                            sparkleSizes[i] = 0;
                        } else {
                            // Update position
                            sparkle.x += sparkle.vx;
                            sparkle.y += sparkle.vy;
                            sparkle.z += sparkle.vz;
                            
                            // Update buffer
                            sparklePositions[i * 3] = sparkle.x;
                            sparklePositions[i * 3 + 1] = sparkle.y;
                            sparklePositions[i * 3 + 2] = sparkle.z;
                            
                            // Size based on life
                            const lifeRatio = 1 - sparkle.life / sparkle.maxLife;
                            const sizeMultiplier = lifeRatio < 0.3 ? 
                                lifeRatio / 0.3 : 
                                (lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1);
                            
                            sparkleSizes[i] = sparkle.size * sizeMultiplier;
                        }
                    } else {
                        sparkleSizes[i] = 0;
                    }
                }
                
                this.sparkleSystem.geometry.attributes.position.needsUpdate = true;
                this.sparkleSystem.geometry.attributes.size.needsUpdate = true;
            }
            
            // Update confetti
            if (this.confettiSystem && this.confettiSystem.geometry) {
                const confettiPositions = this.confettiSystem.geometry.attributes.position.array;
                const confettiSizes = this.confettiSystem.geometry.attributes.size.array;
                
                for (let i = 0; i < this.confetti.length; i++) {
                    const confetti = this.confetti[i];
                    
                    if (confetti.active) {
                        // Update life
                        confetti.life += delta * 60;
                        
                        if (confetti.life >= confetti.maxLife) {
                            confetti.active = false;
                            confettiSizes[i] = 0;
                        } else {
                            // Update velocity with acceleration
                            confetti.vx += confetti.ax;
                            confetti.vy += confetti.ay;
                            confetti.vz += confetti.az;
                            
                            // Update position
                            confetti.x += confetti.vx;
                            confetti.y += confetti.vy;
                            confetti.z += confetti.vz;
                            
                            // Update rotation
                            confetti.rotation += confetti.rotationSpeed;
                            
                            // Update buffer
                            confettiPositions[i * 3] = confetti.x;
                            confettiPositions[i * 3 + 1] = confetti.y;
                            confettiPositions[i * 3 + 2] = confetti.z;
                            
                            // Size based on life
                            const lifeRatio = 1 - confetti.life / confetti.maxLife;
                            confettiSizes[i] = confetti.size * (lifeRatio > 0.8 ? lifeRatio / 0.8 : 1);
                        }
                    } else {
                        confettiSizes[i] = 0;
                    }
                }
                
                this.confettiSystem.geometry.attributes.position.needsUpdate = true;
                this.confettiSystem.geometry.attributes.size.needsUpdate = true;
            }
        } catch (error) {
            console.error("Error in effects update:", error);
        }
    }
} 