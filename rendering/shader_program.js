  createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
    if (!vertexShader || !fragmentShader) {
      return null;
    }
  
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      console.error("Could not create shader program");
      return null;
    }
  
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      gl.deleteProgram(shaderProgram);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
  
    return shaderProgram;
  }