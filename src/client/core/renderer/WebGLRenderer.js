/**
 * WebGLRenderer - Handles rendering using WebGL for better performance
 */
export class WebGLRenderer {
    /**
     * Creates a new WebGL renderer
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     * @param {Object} options - Renderer options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            ...options
        };
        
        // Initialize WebGL context
        this.gl = this.initWebGL();
        
        if (!this.gl) {
            console.error('WebGL not supported, falling back to Canvas renderer');
            return;
        }
        
        // Initialize shaders and buffers
        this.initShaders();
        this.initBuffers();
        
        // Set up viewport
        this.resize(canvas.width, canvas.height);
        
        // Texture cache
        this.textures = new Map();
        
        // Rendering state
        this.isReady = true;
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            textureBinds: 0
        };
    }
    
    /**
     * Initializes WebGL context
     * @returns {WebGLRenderingContext|null} WebGL context or null if not supported
     */
    initWebGL() {
        try {
            // Try to get WebGL 2 context first
            let gl = this.canvas.getContext('webgl2', this.options);
            
            // Fall back to WebGL 1 if WebGL 2 is not available
            if (!gl) {
                gl = this.canvas.getContext('webgl', this.options) || 
                     this.canvas.getContext('experimental-webgl', this.options);
            }
            
            if (!gl) {
                throw new Error('WebGL not supported');
            }
            
            // Enable alpha blending
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            
            // Disable depth testing for 2D rendering
            gl.disable(gl.DEPTH_TEST);
            
            // Set clear color (transparent)
            gl.clearColor(0, 0, 0, 0);
            
            return gl;
        } catch (error) {
            console.error('Error initializing WebGL:', error);
            return null;
        }
    }
    
    /**
     * Initializes WebGL shaders
     */
    initShaders() {
        const gl = this.gl;
        
        // Vertex shader source
        const vsSource = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            
            uniform mat3 uModelViewMatrix;
            uniform mat3 uProjectionMatrix;
            
            varying highp vec2 vTextureCoord;
            
            void main(void) {
                vec3 position = uProjectionMatrix * uModelViewMatrix * vec3(aVertexPosition, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
        `;
        
        // Fragment shader source
        const fsSource = `
            precision mediump float;
            
            varying highp vec2 vTextureCoord;
            
            uniform sampler2D uSampler;
            uniform vec4 uColor;
            uniform float uAlpha;
            
            void main(void) {
                vec4 texColor = texture2D(uSampler, vTextureCoord);
                gl_FragColor = texColor * uColor;
                gl_FragColor.a *= uAlpha;
            }
        `;
        
        // Create shader program
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);
        
        // Check if shader program was created successfully
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program:', gl.getProgramInfoLog(this.shaderProgram));
            return;
        }
        
        // Get shader attributes and uniforms
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
                textureCoord: gl.getAttribLocation(this.shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                sampler: gl.getUniformLocation(this.shaderProgram, 'uSampler'),
                color: gl.getUniformLocation(this.shaderProgram, 'uColor'),
                alpha: gl.getUniformLocation(this.shaderProgram, 'uAlpha'),
            },
        };
    }
    
    /**
     * Compiles a shader
     * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
     * @param {string} source - Shader source code
     * @returns {WebGLShader} Compiled shader
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Initializes WebGL buffers
     */
    initBuffers() {
        const gl = this.gl;
        
        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        
        // Create texture coordinate buffer
        this.textureCoordBuffer = gl.createBuffer();
        
        // Create index buffer
        this.indexBuffer = gl.createBuffer();
        
        // Set up quad vertices (2 triangles forming a rectangle)
        this.vertices = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        
        // Set up texture coordinates
        this.textureCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        
        // Set up indices
        this.indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
        
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        
        // Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.textureCoords, gl.STATIC_DRAW);
        
        // Bind index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }
    
    /**
     * Resizes the renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        if (!this.gl) return;
        
        this.gl.viewport(0, 0, width, height);
        
        // Update projection matrix for new aspect ratio
        this.projectionMatrix = this.createOrthoMatrix(0, width, height, 0, -1, 1);
    }
    
    /**
     * Creates an orthographic projection matrix
     * @param {number} left - Left bound
     * @param {number} right - Right bound
     * @param {number} bottom - Bottom bound
     * @param {number} top - Top bound
     * @param {number} near - Near bound
     * @param {number} far - Far bound
     * @returns {Float32Array} Projection matrix
     */
    createOrthoMatrix(left, right, bottom, top, near, far) {
        // Convert to clip space coordinates (-1 to 1)
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        
        return new Float32Array([
            -2 * lr, 0, 0,
            0, -2 * bt, 0,
            0, 0, 2 * nf,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf
        ]);
    }
    
    /**
     * Creates a model-view matrix for transforming vertices
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} rotation - Rotation in radians
     * @param {number} scaleX - X scale
     * @param {number} scaleY - Y scale
     * @returns {Float32Array} Model-view matrix
     */
    createModelViewMatrix(x, y, width, height, rotation = 0, scaleX = 1, scaleY = 1) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Scale, rotate, translate
        return new Float32Array([
            cos * scaleX * width, sin * scaleX * width, 0,
            -sin * scaleY * height, cos * scaleY * height, 0,
            x, y, 1
        ]);
    }
    
    /**
     * Clears the canvas
     */
    clear() {
        if (!this.gl) return;
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Reset stats
        this.stats.drawCalls = 0;
        this.stats.triangles = 0;
        this.stats.textureBinds = 0;
    }
    
    /**
     * Loads a texture into WebGL
     * @param {string} id - Texture identifier
     * @param {HTMLImageElement|HTMLCanvasElement} image - Image to load
     * @returns {WebGLTexture} WebGL texture
     */
    loadTexture(id, image) {
        if (!this.gl) return null;
        
        // Check if texture is already loaded
        if (this.textures.has(id)) {
            return this.textures.get(id);
        }
        
        const gl = this.gl;
        
        // Create a texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Upload the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Store the texture
        this.textures.set(id, texture);
        
        return texture;
    }
    
    /**
     * Draws a texture
     * @param {string|WebGLTexture} textureId - Texture identifier or WebGL texture
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Drawing options
     */
    drawTexture(textureId, x, y, width, height, options = {}) {
        if (!this.gl || !this.isReady) return;
        
        const gl = this.gl;
        
        // Get texture
        let texture;
        if (typeof textureId === 'string') {
            texture = this.textures.get(textureId);
            if (!texture) {
                console.warn(`Texture not found: ${textureId}`);
                return;
            }
        } else {
            texture = textureId;
        }
        
        // Set shader program
        gl.useProgram(this.programInfo.program);
        
        // Set vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2, // 2 components per vertex
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        
        // If texture coordinates are provided, update the buffer
        if (options.textureCoords) {
            const { u0, v0, u1, v1 } = options.textureCoords;
            const coords = new Float32Array([
                u0, v0,
                u1, v0,
                u0, v1,
                u1, v1
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, coords, gl.DYNAMIC_DRAW);
        }
        
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.textureCoord,
            2, // 2 components per texture coord
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
        
        // Set indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        
        // Set uniforms
        gl.uniformMatrix3fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            this.projectionMatrix
        );
        
        // Create model-view matrix
        const modelViewMatrix = this.createModelViewMatrix(
            x, y, width, height,
            options.rotation || 0,
            options.scaleX || 1,
            options.scaleY || 1
        );
        
        gl.uniformMatrix3fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        
        // Set color and alpha
        gl.uniform4fv(
            this.programInfo.uniformLocations.color,
            options.color || [1, 1, 1, 1]
        );
        
        gl.uniform1f(
            this.programInfo.uniformLocations.alpha,
            options.alpha !== undefined ? options.alpha : 1
        );
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.programInfo.uniformLocations.sampler, 0);
        
        // Draw
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        
        // Update stats
        this.stats.drawCalls++;
        this.stats.triangles += 2;
        this.stats.textureBinds++;
    }
    
    /**
     * Draws a sprite from a texture atlas
     * @param {WebGLTexture} atlasTexture - Atlas texture
     * @param {Object} coords - Texture coordinates in the atlas
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Drawing options
     */
    drawSprite(atlasTexture, coords, x, y, width, height, options = {}) {
        this.drawTexture(
            atlasTexture,
            x, y, width, height,
            {
                ...options,
                textureCoords: coords
            }
        );
    }
    
    /**
     * Draws a colored rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Array<number>} color - Color [r, g, b, a]
     */
    drawRect(x, y, width, height, color = [1, 1, 1, 1]) {
        if (!this.gl || !this.isReady) return;
        
        // Create a 1x1 white texture if not already created
        if (!this.whiteTexture) {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 1, 1);
            this.whiteTexture = this.loadTexture('white', canvas);
        }
        
        // Draw rectangle using white texture and color
        this.drawTexture(this.whiteTexture, x, y, width, height, { color });
    }
    
    /**
     * Disposes of WebGL resources
     */
    dispose() {
        if (!this.gl) return;
        
        const gl = this.gl;
        
        // Delete buffers
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.textureCoordBuffer);
        gl.deleteBuffer(this.indexBuffer);
        
        // Delete textures
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        
        // Delete shader program
        gl.deleteProgram(this.shaderProgram);
        
        this.isReady = false;
    }
}
