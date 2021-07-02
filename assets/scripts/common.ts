
import { Vec2, Vec3, math } from 'cc';

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

    export function linesCross(start1:Vec2, end1:Vec2, start2:Vec2, end2:Vec2) : Vec2|null
    {
        // calculate the differences between the start and end X/Y positions for each of our points
        var delta1x:number = end1.x - start1.x;
        var delta1y:number = end1.y - start1.y;
        var delta2x:number = end2.x - start2.x;
        var delta2y:number = end2.y - start2.y;
    
        // create a 2D matrix from our vectors and calculate the determinant
        var determinant = delta1x * delta2y - delta2x * delta1y;
    
        if(math.bits.abs(determinant) < 0.0001)
        {
            // if the determinant is effectively zero then the lines are parallel/colinear
            return null;
        }
    
        // if the coefficients both lie between 0 and 1 then we have an intersection
        var ab = ((start1.y - start2.y) * delta2x - (start1.x - start2.x) * delta2y) / determinant;
    
        if(ab > 0 && ab < 1)
        {
            var cd = ((start1.y - start2.y) * delta1x - (start1.x - start2.x) * delta1y) / determinant;
    
            if(cd > 0 && cd < 1)
            {
                // lines cross – figure out exactly where and return it
                let intersectX = start1.x + ab * delta1x;
                let intersectY = start1.y + ab * delta1y;
                return new Vec2(intersectX, intersectY);
            }
        }
    
        return null;
    }
}