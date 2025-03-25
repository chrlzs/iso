// ...existing code...
export class Scene {
    objects: SceneObject[] = [];
    rotation: number;
  
    constructor(private gl: WebGLRenderingContext, private textureManager: TextureManager) {
      this.rotation = 0;
    }
  
    addObject(positions: number[], normals: number[], textureCoordinates: number[], textureUrl: string, normalMapUrl: string) {
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
  
      const normalBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
  
      const textureCoordBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);
  
      const texture = this.textureManager.loadTexture(this.gl, textureUrl);
  	const normalTexture = this.textureManager.loadNormalMap(this.gl, normalMapUrl);
  
      this.objects.push({
        buffers: {
          position: positionBuffer,
          normal: normalBuffer,
          textureCoord: textureCoordBuffer,
        },
        texture: texture,
  	  normalTexture: normalTexture,
        vertexCount: positions.length / 3,
      });
    }
  
    update() {
      this.rotation += 0.01;
    }
  }
// ...existing code...
