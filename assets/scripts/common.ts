
import { Vec2, Vec3 } from 'cc';

export namespace Maze_Common
{
    export function toVec2(val:Vec3) : Vec2
    {
        return new Vec2(val.x, val.y);
    }

    export function toVec3(val:Vec2) : Vec3
    {
        return new Vec3(val.x, val.y, 0);
    }
}