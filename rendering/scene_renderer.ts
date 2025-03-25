// ...existing code...
  drawScene(gl: WebGLRenderingContext, scene: Scene) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
  
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
  
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [-0.0, 0.0, -6.0]);  // amount to translate
  
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                scene.rotation,     // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around (Z)
  
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                scene.rotation * .7,// amount to rotate in radians
                [0, 1, 0]);       // axis to rotate around (X)
  
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  
    for (const object of scene.objects) {
      const buffers = object.buffers;
      const texture = object.texture;
  	const normalTexture = object.normalTexture;
  
      {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            this.shader.attributeLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            this.shader.attributeLocations.vertexPosition);
      }
  
      {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            this.shader.attributeLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            this.shader.attributeLocations.vertexNormal);
      }
  
      {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            this.shader.attributeLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            this.shader.attributeLocations.textureCoord);
      }
  
      this.shader.use(gl);
      this.shader.setUniforms(gl, projectionMatrix, modelViewMatrix, normalMatrix, texture, normalTexture);
  
      {
        const offset = 0;
        const vertexCount = object.vertexCount;
        gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
      }
    }
  }
// ...existing code...
