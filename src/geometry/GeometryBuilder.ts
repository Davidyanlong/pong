import { Geometry } from "./Geometry"

export class GeometryBuilder {
    public createQuadGeometry(): Geometry {
        const vertices = new Float32Array([
            // t1
            -0.5, -0.5, 0.0,  // bottom left
            -0.5, 0.5, 0.0,   // top left
            0.5, -0.5, 0.0,   // bottom right
            0.5, 0.5, 0.0,   // top right

        ])

        const indices = new Uint16Array([
            0, 1, 2,  // t1
            1, 3, 2   // t2
        ]);

        const colors = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1

        ])

        const texCoords = new Float32Array([
            0, 1, // bottom left
            0, 0, // top left
            1, 1, // bottom right
            1, 0  // top right
        ])



        return new Geometry(vertices, indices, colors, texCoords);
    }
}