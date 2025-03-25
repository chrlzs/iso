export class BasicShader {
    program: WebGLProgram;
    gl: WebGLRenderingContext;
  
    // Locations for attributes and uniforms
    attributeLocations: {
      vertexPosition: number;
      vertexNormal: number;
      textureCoord: number;
    };
  
    uniformLocations: {
      modelViewMatrix: WebGLUniformLocation | null;
      projectionMatrix: WebGLUniformLocation | null;
      normalMatrix: WebGLUniformLocation | null;
      sampler: WebGLUniformLocation | null;
      normalSampler: WebGLUniformLocation | null;
    };
  
    constructor(gl: WebGLRenderingContext) {
      this.gl = gl;
      const shaderProgram = this.initShaderProgram(gl);
  
      if (!shaderProgram) {
        throw new Error("Unable to initialize the shader program.");
      }
  
      this.program = shaderProgram;
  
      this.attributeLocations = {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      };
  
      this.uniformLocations = {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        normalSampler: gl.getUniformLocation(shaderProgram, 'uNormalSampler'),
      };
    }
  
    initShaderProgram(gl: WebGLRenderingContext): WebGLProgram | null {
      const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;
  
        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
  
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
  
        void main(void) {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vTextureCoord = aTextureCoord;
  
          // Apply lighting effect
  
          highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
          highp vec3 directionalLightColor = vec3(1, 1, 1);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
  
          highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  
          highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
          vLighting = ambientLight + (directionalLightColor * directional);
        }
      `;
  
      const fsSource = `
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
  
        uniform sampler2D uSampler;
  	uniform sampler2D uNormalSampler;
  
        void main(void) {
          highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
  	  highp vec4 normalColor = texture2D(uNormalSampler, vTextureCoord);
          gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
        }
      `;
  
      const shaderProgram = new ShaderProgram();
      return shaderProgram.createShaderProgram(gl, vsSource, fsSource);
    }
  
    use(gl: WebGLRenderingContext) {
      gl.useProgram(this.program);
    }
  
    setUniforms(gl: WebGLRenderingContext, projectionMatrix: number[], modelViewMatrix: number[], normalMatrix: number[], texture: WebGLTexture, normalTexture: WebGLTexture) {
      gl.uniformMatrix4fv(
        this.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
      gl.uniformMatrix4fv(
        this.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
      gl.uniformMatrix4fv(
        this.uniformLocations.normalMatrix,
        false,
        normalMatrix);
  
      // Tell WebGL we want to affect texture unit 0
      gl.activeTexture(gl.TEXTURE0);
  
      // Bind the texture to texture unit 0
      gl.bindTexture(gl.TEXTURE_2D, texture);
  
      // Tell the shader we bound the texture to texture unit 0
      gl.uniform1i(this.uniformLocations.sampler, 0);
  
  	// Tell WebGL we want to affect texture unit 1
      gl.activeTexture(gl.TEXTURE1);
  
      // Bind the texture to texture unit 1
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
  
      // Tell the shader we bound the texture to texture unit 1
      gl.uniform1i(this.uniformLocations.normalSampler, 1);
    }
  }
