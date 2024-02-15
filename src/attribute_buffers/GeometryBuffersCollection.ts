import { GeometryBuilder } from "../geometry/GeometryBuilder";
import { GeometryBuffers } from "./GeometryBuffers";

export class GeometryBuffersCollection{
    public static cubeBuffers:GeometryBuffers

    public static initialize(device:GPUDevice){
        const geometry = new GeometryBuilder().createCubeGeometry();

        this.cubeBuffers = new GeometryBuffers(device, geometry);
    }
}