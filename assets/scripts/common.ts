
import { Vec2, Vec3, math, ResolutionPolicy, randomRange, Line } from 'cc';
import { Maze_DoubleLinkedList } from './common/doubleLinkedList';

export namespace Maze_Common
{
    export class Line
    {
        startPoint:Vec2 = new Vec2(0, 0);
        endPoint:Vec2 = new Vec2(0, 0);

        constructor(startPoint:Vec2, endPoint:Vec2 )
        {
            this.startPoint = startPoint;
            this.endPoint = endPoint;
        }
    }

    /*
     * toVec2 - generates Vec2 out of Vec3, ignoring the z axis.
     * @param val:Vec3 - input Vec3 to be coverted to Vec2
     * @return - Vec2, which gets x & y axis from the input val.
     */  
    export function toVec2(val:Vec3) : Vec2
    {
        return new Vec2(val.x, val.y);
    }

    /*
     * toVec3 - generates Vec3 out of Vec2, with the z axis equal to 0.
     * @param val:Vec2 - input Vec2 to be coverted to Vec3
     * @return - Vec3, which gets x & y axis from the input val and has axis z equal to 0.
     */  
    export function toVec3(val:Vec2) : Vec3
    {
        return new Vec3(val.x, val.y, 0);
    }

    /*
     * linesCross - checks whether 2 lines cross and returns the intersection point.
     * @param line1:Line - input Line to be checked whether in intersects with line2.
     * @param line2:Line - input Line to be checked whether in intersects with line1.
     * @return - if intersection was found, returns the intersection point. Otherwise returns null.
     */
    export function linesCross(line1:Line, line2:Line) : Vec2|null
    {
        // calculate the differences between the start and end X/Y positions for each of our points
        var delta1x:number = line1.endPoint.x - line1.startPoint.x;
        var delta1y:number = line1.endPoint.y - line1.startPoint.y;
        var delta2x:number = line2.endPoint.x - line2.startPoint.x;
        var delta2y:number = line2.endPoint.y - line2.startPoint.y;
    
        // create a 2D matrix from our vectors and calculate the determinant
        var determinant = delta1x * delta2y - delta2x * delta1y;
    
        if(math.bits.abs(determinant) < 0.0001)
        {
            // if the determinant is effectively zero then the lines are parallel/colinear
            return null;
        }
    
        // if the coefficients both lie between 0 and 1 then we have an intersection
        var ab = ((line1.startPoint.y - line2.startPoint.y) * delta2x - (line1.startPoint.x - line2.startPoint.x) * delta2y) / determinant;
    
        if(ab > 0 && ab < 1)
        {
            var cd = ((line1.startPoint.y - line2.startPoint.y) * delta1x - (line1.startPoint.x - line2.startPoint.x) * delta1y) / determinant;
    
            if(cd > 0 && cd < 1)
            {
                // lines cross – figure out exactly where and return it
                let intersectX = line1.startPoint.x + ab * delta1x;
                let intersectY = line1.startPoint.y + ab * delta1y;
                return new Vec2(intersectX, intersectY);
            }
        }
    
        return null;
    }

    /*
     * rectDiagonal - calculates length of the diagonal of the specified rectangle
     * @param rectDimensions:Vec2 - description of the rectangle. Its top right point.
     * @return - the length of the diagonal of the specified rectangle.
     */
    export function rectDiagonal( rectDimensions:Vec2 ) : number
    {
        return Math.sqrt(Math.pow(rectDimensions.x,2) + Math.pow(rectDimensions.y,2));
    }

    /*
     * generateRandomPoint - returns the random point within the specified dimensions.
     * @param dimensions:Vec2 - dimensions of the ranges for x and y.
     * @param outputVec:Vec2 - the result point. x & y will be modified with:
     * - x = from 0 to dimensions.x
     * - y = from 0 to dimensions.y
     */
    export function generateRandomPoint(dimensions:Vec2) : Vec2
    {
        var result:Vec2 = new Vec2(0,0);
        result.x = randomRange(0, dimensions.x);
        result.y = randomRange(0, dimensions.y);
        return result;
    }

    /*
     * checkCollinearVectors - check whether 2 vectors are collinear or not.
     * @param vec1:Vec2 - first vector to be checked
     * @param vec2:Vec2 - second vector to be checked
     * @return - the point within the provided dimensions with:
     * - x = from 0 to dimensions.x
     * - y = from 0 to dimensions.y
     */
    export function checkCollinearVectors(vec1:Vec2, vec2:Vec2) : boolean
    {
        var tmp:Vec2 = vec1.clone();
        return tmp.cross(vec2) == 0;
    }

    /*
     * resizeLine - resizes line from the start point in direction of endpoint. 
     * result length of the line will be equaled to the length parameter.
     * @param line:Line - the line to be resized
     * @param length:number - target length of the line
     */
    export function resizeLine(line:Line, length:number) : Line
    {
        return { startPoint : line.startPoint.clone(), endPoint : line.endPoint.clone().subtract(line.startPoint).normalize().multiplyScalar( length ).add(line.startPoint) };
    }

    /////////////////////// Polygon generation algorithm START ///////////////////////

    /*
     * generateConvexPolygon - generates a polygon within the specified dimensions.
     * @param dimensions:Vec2 - rectangle, within which the polygon will be located.
     * @param numberOfVerticaes:number - number of vertices to be contained in the polygon. 3 at least.
     * @param excludeFromCenterFactor:nubmer - specifies, which part of area starting from center of
     * dimensions will be ecluded from ranodmized selection of the points.
     * @param origin:number - where to shift the resulting points.
     * @return - array of points of the polygon
     */
    export function generateConvexPolygon(dimensions:Vec2, numberOfVertices:number, excludeFromCenterFactor:number, origin:Vec2) : Array<Vec2>
    {
        var excludeFromCenterFactorNormalized = excludeFromCenterFactor;

        if( excludeFromCenterFactorNormalized < 0 )
        {
            excludeFromCenterFactorNormalized = 0;
        }
        else if( excludeFromCenterFactorNormalized > 1 )
        {
            excludeFromCenterFactorNormalized = 1;
        }

        if(numberOfVertices < 3)
        {
            throw Error("There should be at least 3 vertices in the polygon");
        }

        var result:Array<Vec2> = [];

        var maxAngle:number = 360;
        var minJumpAngle = maxAngle / numberOfVertices * 0.7;
        var maxJumpAngle = maxAngle / numberOfVertices * 1.3;

        var angle:number = 0;
        var upVec:Vec2 = new Vec2(0,1);
        var dimensionDiagonalLength:number = rectDiagonal(dimensions);

        var borders:Maze_DoubleLinkedList.DoubleLinkedList<Line> = new Maze_DoubleLinkedList.DoubleLinkedList<Line>();

        borders.add( new Line( new Vec2(0, 0), new Vec2(0, dimensions.y) ) );
        borders.add( new Line( new Vec2(0, dimensions.y), new Vec2(dimensions.x, dimensions.y) ) );
        borders.add( new Line( new Vec2(dimensions.x, dimensions.y), new Vec2(dimensions.x, 0) ) );
        borders.add( new Line( new Vec2(dimensions.x, 0), new Vec2(0, 0) ) );

        var polygonCenter:Vec2 = dimensions.clone().multiplyScalar(0.5);

        var curentNumberOfVertices:number = 0;
        var zeroVec = new Vec2(0,0);

        while(angle < maxAngle && curentNumberOfVertices < numberOfVertices)
        {
            var angleDelta:number = randomRange(minJumpAngle, maxJumpAngle);

            if(angle+angleDelta > maxAngle)
            {
                angleDelta = maxAngle-angle;
            }

            angle += angleDelta;

            var checkIntersectionVec:Vec2 = upVec.clone().rotate(math.toRadian(-angle));

            checkIntersectionVec = resizeLine( new Line(zeroVec, checkIntersectionVec), dimensionDiagonalLength).endPoint.add(polygonCenter);

            var checkIntersectionLine:Line = new Line( polygonCenter, checkIntersectionVec );

            for(var edge of borders)
            {
                if(null != edge.value)
                {
                    var intersectionPoint = linesCross( checkIntersectionLine, edge.value );

                    if(null != intersectionPoint)
                    {
                        var x:number = randomRange( polygonCenter.x + ( ( intersectionPoint.x - polygonCenter.x ) * excludeFromCenterFactorNormalized ), intersectionPoint.x);
                        var xPart:number = ( x - polygonCenter.x ) / ( intersectionPoint.x - polygonCenter.x );
                        var y = polygonCenter.y + ( intersectionPoint.y - polygonCenter.y ) * xPart;

                        var newPoint:Vec2 = new Vec2( x, y ).add(origin);
                        result.push(newPoint);
                        curentNumberOfVertices += 1;
                        break;
                    }
                }
            }
        }

        return result;
    }

    /////////////////////// Polygon generation algorithm END ///////////////////////
}