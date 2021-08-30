
import { Vec2, Vec3, math, ResolutionPolicy, randomRange, Line, Rect } from 'cc';
import { Maze_DoubleLinkedList } from './common/doubleLinkedList';

export namespace Maze_Common
{
    function isEqual(objects:any[]) : boolean
    {
        return objects.every(obj => JSON.stringify(obj) === JSON.stringify(objects[0]));
    }

    function isEquivalent(a:any, b:any) {
        // Create arrays of property names
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);
    
        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length != bProps.length) 
        {
            return false;
        }
    
        for (var i = 0; i < aProps.length; i++) 
        {
            var propName = aProps[i];
    
            // If values of same property are not equal,
            // objects are not equivalent
            if (a[propName] !== b[propName]) 
            {
                return false;
            }
        }
    
        // If we made it this far, objects
        // are considered equivalent
        return true;
    }

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
     * @param out:Vec2|null - optimization parameter which allows to avoid creation of the new vector on each call.
     * @return - [0] - whether intersection was found. [1] - intersection.
     */
    export function linesCross(line1:Line, line2:Line, out:Vec2|null = null) : [boolean,Vec2]
    {
        return linesCrossOptimized(line1.startPoint.x, line1.startPoint.y, line1.endPoint.x, line1.endPoint.y, 
                            line2.startPoint.x, line2.startPoint.y, line2.endPoint.x, line2.endPoint.y, out);
    }

    export function linesCrossOptimized(x1:number, y1:number, x2:number, y2:number, x3:number, y3:number, x4:number, y4:number, out:Vec2|null = null) : [boolean,Vec2]
    {
        var result:[boolean,Vec2] = [false, null != out ? out : new Vec2()];

        // calculate the differences between the start and end X/Y positions for each of our points
        var delta_x2_x1:number = x2 - x1;
        var delta_y2_y1:number = y2 - y1;
        var delta_x4_x3:number = x4 - x3;
        var delta_y4_y3:number = y4 - y3;

        var delta_x1_x3:number = x1 - x3;
        var delta_y1_y3:number = y1 - y3;
    
        // create a 2D matrix from our vectors and calculate the determinant
        var determinant = delta_x2_x1 * delta_y4_y3 - delta_x4_x3 * delta_y2_y1;
    
        if(math.bits.abs(determinant) < 0.0001)
        {
            // if the determinant is effectively zero then the lines are parallel/colinear
            return result;
        }
    
        // if the coefficients both lie between 0 and 1 then we have an intersection
        var ab = (delta_y1_y3 * delta_x4_x3 - delta_x1_x3 * delta_y4_y3) / determinant;
    
        if(ab >= 0 && ab <= 1)
        {
            var cd = (delta_y1_y3 * delta_x2_x1 - delta_x1_x3 * delta_y2_y1) / determinant;
    
            if(cd >= 0 && cd <= 1)
            {
                // lines cross – figure out exactly where and return it
                var intersectX = x1 + ab * delta_x2_x1;
                var intersectY = y1 + ab * delta_y2_y1;
                result[0] = true;
                result[1].x = intersectX;
                result[1].y = intersectY;
                return result;
            }
        }
    
        return result;
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
     * collinearVectors - check whether 2 vectors are collinear or not.
     * @param x1, y1 - first vector to be checked
     * @param x2, y2 - second vector to be checked
     * @return - true if provided vectors are collinear. False otherwise.
     */
    export function collinearVectors(x1:number, y1:number, x2:number, y2:number) : boolean
    {
        return (x1 * y2 - y1 * x2) == 0;
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

    export const upVector:Vec2 = new Vec2(0,1);

    export function convertSingleAngleToUpVectorTo_0_360(angle:number)
    {
        return angle > 0 ? angle : angle + 360;
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

        if(numberOfVertices == 4)
        {
            var minJumpAngle = 90;
            var maxJumpAngle = 90;
            var angle:number = -45;
        }
        
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

            var checkIntersectionVec:Vec2 = Maze_Common.upVector.clone().rotate(math.toRadian(angle));

            checkIntersectionVec = resizeLine( new Line(zeroVec, checkIntersectionVec), dimensionDiagonalLength).endPoint.add(polygonCenter);

            var checkIntersectionLine:Line = new Line( polygonCenter, checkIntersectionVec );

            for(var edge of borders)
            {
                if(null != edge.value)
                {
                    var intersectionPoint = linesCross( checkIntersectionLine, edge.value );

                    if(true == intersectionPoint[0])
                    {
                        var x:number = randomRange( polygonCenter.x + ( ( intersectionPoint[1].x - polygonCenter.x ) * excludeFromCenterFactorNormalized ), intersectionPoint[1].x);
                        var xPart:number = ( x - polygonCenter.x ) / ( intersectionPoint[1].x - polygonCenter.x );
                        var y = polygonCenter.y + ( intersectionPoint[1].y - polygonCenter.y ) * xPart;

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

    export function perpendicularClockwise(vec:Vec2):Vec2
    {
        return new Vec2(vec.y, -vec.x);
    }

    export function perpendicularCounterClockwise(vec:Vec2):Vec2
    {
        return new Vec2(-vec.y, vec.x);
    }

    export function isPointInsideRectangle(point:Vec2, rect:Rect) : boolean
    {
        var A:Vec2 = new Vec2(rect.xMin, rect.yMin);
        var B:Vec2 = new Vec2(rect.xMin, rect.yMax);
        var C:Vec2 = new Vec2(rect.xMax, rect.yMax);
        var D:Vec2 = new Vec2(rect.xMax, rect.yMin);

        var AB:Vec2 = B.clone().subtract(A);
        var AP = point.clone().subtract(A);
        var BC = C.clone().subtract(B);
        var BP = point.clone().subtract(B);
        
        var dotABAP = AB.dot(AP);
        var dotABAB = AB.dot(AB);
        var dotBCBP = BC.dot(BP);
        var dotBCBC = BC.dot(BC);
        return 0 <= dotABAP && dotABAP <= dotABAB && 0 <= dotBCBP && dotBCBP <= dotBCBC;
    }

    export function vectorLength(x:number, y:number)
    {
        return Math.sqrt( x*x + y*y );
    }

    //cx,cy is center point of the circle 
    export function closestLineCircleIntersection(circleCenter:Vec2, radius:number, lineStartX:number, lineStartY:number, lineEndX:number, lineEndY:number):Vec2|null
    {
        var intersections = findLineCircleIntersections(circleCenter, radius, lineStartX, lineStartY, lineEndX, lineEndY);

        if (null != intersections[0] && null == intersections[1])
        {
            return intersections[0]; // one intersection
        }
        else if (null == intersections[0] && null != intersections[1])
        {
            return intersections[1]; // one intersection
        }
        else if (null != intersections[0] && null != intersections[1])
        {
            var dist1:number = vectorLength(lineStartX - intersections[0].x, lineStartY - intersections[0].y);
            var dist2:number = vectorLength(lineStartX - intersections[1].x, lineStartY - intersections[1].y);

            if (dist1 < dist2)
            {
                return intersections[0];
            }
            else
            {
                return intersections[1];
            }
        }

        return null; // no intersections at all
    }

    // Find the points of intersection.
    export function findLineCircleIntersections(circleCenter:Vec2, radius:number, lineStartX:number, lineStartY:number, lineEndX:number, lineEndY:number):[Vec2|null,Vec2|null]
    {
        var intersections:[Vec2|null,Vec2|null] = [null, null];

        var dx:number = lineEndX - lineStartX;
        var dy:number = lineEndY - lineStartY;

        var A:number = Math.pow(dx,2) + Math.pow(dy,2);
        var B:number = 2 * (dx * (lineStartX - circleCenter.x) + dy * (lineStartY - circleCenter.y));
        var C:number = Math.pow(lineStartX - circleCenter.x, 2) + Math.pow(lineStartY - circleCenter.y, 2) - Math.pow(radius, 2);

        var det:number = B * B - 4 * A * C;
        if ((A <= 0.0000001) || (det < 0))
        {
            // No real solutions.
            intersections[0] = null;
            intersections[1] = null;
            return intersections;
        }
        else if (det == 0)
        {
            // One solution.
            var t:number = -B / (2 * A);

            if(0 <= t && t <= 1)
            {
                intersections[0] = new Vec2(lineStartX + t * dx, lineStartY + t * dy);
            }
            else
            {
                intersections[0] = null;
            }

            intersections[1] = null;
            return intersections;
        }
        else
        {
            // Two solutions.
            var t:number = (-B + Math.sqrt(det)) / (2 * A);

            if(0 <= t && t <= 1)
            {
                intersections[0] = new Vec2(lineStartX + t * dx, lineStartY + t * dy);
            }
            else
            {
                intersections[0] = null;
            }

            t = (-B - Math.sqrt(det)) / (2 * A);

            if(0 <= t && t <= 1)
            {
                intersections[1] = new Vec2(lineStartX + t * dx, lineStartY + t * dy);
            }
            else
            {
                intersections[1] = null;
            }

            return intersections;
        }
    }

    export function doesLineIntersectCircle(x1:number, y1:number, x2:number, y2:number, circleCenter:Vec2, circleRadius:number):boolean
    {
        var ac:Vec2 = new Vec2(circleCenter.x - x1, circleCenter.y - y1);
        var ab:Vec2 = new Vec2(x2 - x1, y2 - y1);
        var ab2 = ab.dot(ab);
        var acab = ac.dot(ab);
        var t = acab / ab2
        t = (t < 0) ? 0 : t
        t = (t > 1) ? 1 : t
        var h:Vec2 = new Vec2((ab.x * t + x1) - circleCenter.x, (ab.y * t + y1) - circleCenter.y);
        var h2 = h.dot(h);
        return h2 <= circleRadius * circleRadius;
    }

    export function doesRectangleIntersectsCircle(rect:Rect, circleCenter:Vec2, circleRadius:number)
    {
        return (isPointInsideRectangle(circleCenter, rect) ||
                doesLineIntersectCircle(rect.x, rect.y, rect.x, rect.yMax, circleCenter, circleRadius) ||
                doesLineIntersectCircle(rect.x, rect.yMax, rect.xMax, rect.yMax, circleCenter, circleRadius) ||
                doesLineIntersectCircle(rect.xMax, rect.yMax, rect.xMax, rect.y, circleCenter, circleRadius) ||
                doesLineIntersectCircle(rect.xMax, rect.y, rect.x, rect.y, circleCenter, circleRadius))
    }

    export function isPointInsideCircle(point:Vec2, circleCenter:Vec2, circleRadius:number) : boolean
    {
        return isPointInsideCircleOptimized(point.x, point.y, circleCenter, circleRadius);
    }

    export function isPointInsideCircleOptimized(x:number, y:number, circleCenter:Vec2, circleRadius:number) : boolean
    {
        return Math.pow(x - circleCenter.x, 2) + Math.pow(y - circleCenter.y,2) <= Math.pow(circleRadius, 2);
    }

    export function normalizeAnglesForCheck(angleFrom:number, angleTo:number, checkAngleFrom:number, checkAngleTo:number):
    [number,number,number,number]
    {
        var finalAngleFrom = 0;
        var finalAngleTo = 0;
        var finalCheckAngleFrom = 0;
        var finalCheckAngleTo = 0;

        var angleToLessThanAngleFrom:boolean = angleTo < angleFrom;
        var checkAngleToLessThanCheckAngleFrom:boolean = checkAngleTo < checkAngleFrom;

        if(true == angleToLessThanAngleFrom && 
           true == checkAngleToLessThanCheckAngleFrom)
        {
            finalAngleFrom = angleFrom;
            finalAngleTo = angleTo + 360;
            finalCheckAngleFrom = checkAngleFrom;
            finalCheckAngleTo = checkAngleTo + 360;
        }
        else if(true == angleToLessThanAngleFrom)
        {
            finalAngleFrom = angleFrom;
            finalAngleTo = angleTo + 360;

            if(checkAngleFrom >= finalAngleFrom && 
                checkAngleFrom <= 360)
            {
                finalCheckAngleFrom = checkAngleFrom;
            }
            else
            {
                finalCheckAngleFrom = checkAngleFrom + 360;
            }

            if(checkAngleTo >= finalAngleFrom && 
                checkAngleTo <= 360)
            {
                finalCheckAngleTo = checkAngleTo;
            }
            else
            {
                finalCheckAngleTo = checkAngleTo + 360;
            }
        }
        else if(true == checkAngleToLessThanCheckAngleFrom)
        {
            finalCheckAngleFrom = checkAngleFrom;
            finalCheckAngleTo = checkAngleTo + 360;

            if(angleFrom >= finalCheckAngleFrom && 
                angleFrom <= 360)
            {
                finalAngleFrom = angleFrom;
            }
            else
            {
                finalAngleFrom = angleFrom + 360;
            }

            if(angleTo >= finalCheckAngleFrom && 
                angleTo <= 360)
            {
                finalAngleTo = angleTo;
            }
            else
            {
                finalAngleTo = angleTo + 360;
            }
        }
        else
        {
            finalAngleFrom = angleFrom;
            finalAngleTo = angleTo;
            finalCheckAngleFrom = checkAngleFrom;
            finalCheckAngleTo = checkAngleTo;
        }

        return [finalAngleFrom,finalAngleTo,finalCheckAngleFrom,finalCheckAngleTo];
    }

    export function checkAngleRangesCollision(angleFrom:number, angleTo:number, checkAngleFrom:number, checkAngleTo:number):boolean
    {
        var normalizationResult = normalizeAnglesForCheck(angleFrom, angleTo, checkAngleFrom, checkAngleTo);

        if(normalizationResult[2] >= normalizationResult[0] && normalizationResult[2] <= normalizationResult[1] ||
           normalizationResult[3] >= normalizationResult[0] && normalizationResult[3] <= normalizationResult[1] ||
           normalizationResult[0] >= normalizationResult[2] && normalizationResult[0] <= normalizationResult[3] ||
           normalizationResult[1] >= normalizationResult[2] && normalizationResult[1] <= normalizationResult[3] )
        {
            return true;
        }

        return false;
    }

    /////////////////////// Polygon generation algorithm END ///////////////////////

    // Use it if you want to sort vertices by angle without calculating the angles. Works ~2-3 times faster, than angles calculation.
    export function pseudoangle(dx:number, dy:number) 
    {
        var diag = dx > dy; 
        var adiag = dx > -dy;

        var r = !adiag ? 4 : 0;

        if (dy == 0)
            return r;

        if (diag !== adiag)
            r += 2 - dx / dy; 
        else
            r += dy / dx; 

        return r;
    }
}