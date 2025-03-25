function Scene(gl, textureManager) {
    this.gl = gl;
    this.textureManager = textureManager;
    this.objects = [];
    this.rotation = 0;
}

Scene.prototype.addObject = function (positions, normals, textureCoordinates, textureUrl, normalMapUrl) {
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
};

Scene.prototype.update = function () {
    this.rotation += 0.01;
};