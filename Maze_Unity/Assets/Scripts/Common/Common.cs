using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Unity.Mathematics;
using System;
using Maze_VectorUtils;

namespace Maze_Common
{
    public static class Common
    {
        public class Line
        {
            private Vector2 mStartPoint = new Vector2(0, 0);
            public Vector2 StartPoint { get => mStartPoint; set => mStartPoint = value; }

            private Vector2 mEndPoint = new Vector2(0, 0);
            public Vector2 EndPoint { get => mEndPoint; set => mEndPoint = value; }

            public Line(Vector2 startPoint, Vector2 endPoint)
            {
                this.mStartPoint = startPoint;
                this.mEndPoint = endPoint;
            }
        }

        /*
         * toVec2 - generates Vector2 out of Vector3, ignoring the z axis.
         * @param val:Vector3 - input Vector3 to be coverted to Vector2
         * @return - Vector2, which gets x & y axis from the input val.
         */
        public static Vector2 toVec2(Vector3 val)
        {
            return new Vector2(val.x, val.y);
        }

        /*
         * toVec3 - generates Vector3 out of Vector2, with the z axis equal to 0.
         * @param val:Vector2 - input Vector2 to be coverted to Vector3
         * @return - Vector3, which gets x & y axis from the input val and has axis z equal to 0.
         */
        public static Vector3 toVec3(Vector2 val)
        {
            return new Vector3(val.x, val.y, 0);
        }

        /*
         * linesCross - checks whether 2 lines cross and returns the intersection point.
         * @param line1:Line - input Line to be checked whether in intersects with line2.
         * @param line2:Line - input Line to be checked whether in intersects with line1.
         * @param resultVec:Vector2 - pass the result vector here. It will be modified if the intersection will be found.
         * @return - whether intersection was found.
         */
        public static bool linesCross(Line line1, Line line2, ref Vector2 resultVec)
        {
            return linesCrossOptimized(line1.StartPoint.x, line1.StartPoint.y, line1.EndPoint.x, line1.EndPoint.y,
                                       line2.StartPoint.x, line2.StartPoint.y, line2.EndPoint.x, line2.EndPoint.y, ref resultVec);
        }

        // linesCrossOptimized - same as linesCross, but with more low-level parameters. Might be faster at runtime.
        public static bool linesCrossOptimized(float x1, float y1, float x2, float y2, float x3, float y3, float x4, float y4, ref Vector2 resultVec)
        {
            bool result = false;

            // calculate the differences between the start and end X/Y positions for each of our points
            float delta_x2_x1 = x2 - x1;
            float delta_y2_y1 = y2 - y1;
            float delta_x4_x3 = x4 - x3;
            float delta_y4_y3 = y4 - y3;

            float delta_x1_x3 = x1 - x3;
            float delta_y1_y3 = y1 - y3;

            // create a 2D matrix from our vectors and calculate the determinant
            var determinant = delta_x2_x1 * delta_y4_y3 - delta_x4_x3 * delta_y2_y1;

            if (math.abs(determinant) < 0.0001)
            {
                // if the determinant is effectively zero then the lines are parallel/colinear
                return result;
            }

            // if the coefficients both lie between 0 and 1 then we have an intersection
            var ab = (delta_y1_y3 * delta_x4_x3 - delta_x1_x3 * delta_y4_y3) / determinant;

            if (ab >= 0 && ab <= 1)
            {
                var cd = (delta_y1_y3 * delta_x2_x1 - delta_x1_x3 * delta_y2_y1) / determinant;

                if (cd >= 0 && cd <= 1)
                {
                    // lines cross – figure out exactly where and return it
                    var intersectX = x1 + ab * delta_x2_x1;
                    var intersectY = y1 + ab * delta_y2_y1;
                    result = true;
                    resultVec.x = intersectX;
                    resultVec.y = intersectY;
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
        public static float rectDiagonal(Vector2 rectDimensions)
        {
            return math.sqrt(math.pow(rectDimensions.x, 2) + math.pow(rectDimensions.y, 2));
        }

        /*
         * randomRangeInt - returns the random int point within the specified dimensions.
         * @param from:int - provide random from value ( inclusive )
         * @param to:int - provide random to value ( exclusive )
         * @return int - the result random integer.
         */
        public static int randomRangeInt(int from, int to)
        {
            System.Random r = new System.Random();
            int rInt = r.Next(from, to);
            return rInt;
        }

        // randomRangeDouble - the same as randomRangeInt, but works for double type.
        public static double randomRangeDouble(double from, double to)
        {
            System.Random r = new System.Random();
            double range = to - from;
            double rDouble = r.NextDouble() * range; //for doubles
            return rDouble;
        }

        // randomRangeFloat - the same as randomRangeInt, but works for double type.
        public static float randomRangeFloat(float from, float to)
        {
            return UnityEngine.Random.Range(from, to);
        }

        /*
         * generateRandomPoint - returns the random point within the specified dimensions.
         * @param dimensions:Vec2 - dimensions of the ranges for x and y.
         * @param outputVec:Vec2 - the result point. x & y will be modified with:
         * - x = from 0 to dimensions.x
         * - y = from 0 to dimensions.y
         */
        public static Vector2 generateRandomPoint(Vector2 dimensions)
        {
            Vector2 result = new Vector2(0, 0);
            result.x = randomRangeFloat(0, dimensions.x);
            result.y = randomRangeFloat(0, dimensions.y);
            return result;
        }

        /*
         * collinearVectors - check whether 2 vectors are collinear or not.
         * @param x1, y1 - first vector to be checked
         * @param x2, y2 - second vector to be checked
         * @return - true if provided vectors are collinear. False otherwise.
         */
        public static bool collinearVectors(float x1, float y1, float x2, float y2)
        {
            return (x1 * y2 - y1 * x2) == 0;
        }

        /*
         * resizeLine - resizes line from the start point in direction of endpoint. 
         * result length of the line will be equaled to the length parameter.
         * @param line:Line - the line to be resized
         * @param length:number - target length of the line
         */
        public static Line resizeLine(Line line, float length)
        {
            //return { startPoint : line.startPoint.clone(), endPoint : line.endPoint.clone().subtract(line.startPoint).normalize().multiplyScalar( length ).add(line.startPoint) };
            Vector2 endPoint = clone(line.EndPoint) - line.StartPoint;
            endPoint.Normalize();
            endPoint = (endPoint * length) + line.StartPoint;
            return new Line(line.StartPoint, endPoint);
        }

        // global upVector to calculate the angle differences between the vector from one single origin direction.
        public static Vector2 upVector = new Vector2(0, 1);

        public static float convertSingleAngleToUpVectorTo_0_360(float angle)
        {
            return angle > 0 ? angle : angle + 360;
        }

        public static Vector2 clone(Vector2 vec)
        {
            return new Vector2(vec.x, vec.y);
        }

        public static Vector3 clone(Vector3 vec)
        {
            return new Vector3(vec.x, vec.y, vec.z);
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
        public static List<Vector2> generateConvexPolygon(Vector2 dimensions, int numberOfVertices, float excludeFromCenterFactor, Vector2 origin)
        {
            float excludeFromCenterFactorNormalized = excludeFromCenterFactor;

            if (excludeFromCenterFactorNormalized < 0)
            {
                excludeFromCenterFactorNormalized = 0;
            }
            else if (excludeFromCenterFactorNormalized > 1)
            {
                excludeFromCenterFactorNormalized = 1;
            }

            if (numberOfVertices < 3)
            {
                throw new System.Exception("There should be at least 3 vertices in the polygon");
            }

            List<Vector2> result = new List<Vector2>();

            float maxAngle = 360;

            var minJumpAngle = (maxAngle / numberOfVertices) * 0.7f;
            var maxJumpAngle = (maxAngle / numberOfVertices) * 1.3f;

            float angle = 0;

            if (numberOfVertices == 4)
            {
                minJumpAngle = 90;
                maxJumpAngle = 90;
                angle = -45;
            }

            float dimensionDiagonalLength = rectDiagonal(dimensions);

            LinkedList<Line> borders = new LinkedList<Line>();

            borders.AddLast(new Line(new Vector2(0, 0), new Vector2(0, dimensions.y)));
            borders.AddLast(new Line(new Vector2(0, dimensions.y), new Vector2(dimensions.x, dimensions.y)));
            borders.AddLast(new Line(new Vector2(dimensions.x, dimensions.y), new Vector2(dimensions.x, 0)));
            borders.AddLast(new Line(new Vector2(dimensions.x, 0), new Vector2(0, 0)));

            Vector2 polygonCenter = dimensions;
            polygonCenter *= 0.5f;

            int curentNumberOfVertices = 0;
            Vector2 zeroVec = new Vector2(0, 0);

            while (angle < maxAngle && curentNumberOfVertices < numberOfVertices)
            {
                float angleDelta = randomRangeFloat(minJumpAngle, maxJumpAngle);

                if (angle + angleDelta > maxAngle)
                {
                    angleDelta = maxAngle - angle;
                }

                angle += angleDelta;

                Vector2 checkIntersectionVec = VectorUtils.RotateBy(clone(Common.upVector), angle);

                checkIntersectionVec = resizeLine(new Line(zeroVec, checkIntersectionVec), dimensionDiagonalLength).EndPoint + polygonCenter;

                Line checkIntersectionLine = new Line(polygonCenter, checkIntersectionVec);

                foreach (var edge in borders)
                {
                    if (null != edge)
                    {
                        Vector2 intersectionVec = new Vector2();
                        var intersectionExists = linesCross(checkIntersectionLine, edge, ref intersectionVec);

                        if (true == intersectionExists)
                        {
                            float x = randomRangeFloat(polygonCenter.x + ((intersectionVec.x - polygonCenter.x) * excludeFromCenterFactorNormalized), intersectionVec.x);
                            float xPart = (x - polygonCenter.x) / (intersectionVec.x - polygonCenter.x);
                            float y = polygonCenter.y + (intersectionVec.y - polygonCenter.y) * xPart;

                            Vector2 newPoint = new Vector2(x, y) + origin;
                            result.Add(newPoint);
                            curentNumberOfVertices += 1;
                            break;
                        }
                    }
                }
            }

            return result;
        }

        public static Vector2 perpendicularClockwise(Vector2 vec)
        {
            return new Vector2(vec.y, -vec.x);
        }

        public static Vector2 perpendicularCounterClockwise(Vector2 vec)
        {
            return new Vector2(-vec.y, vec.x);
        }

        public static bool isPointInsideRectangle(Vector2 point, Rect rect)
        {
            Vector2 A = new Vector2(rect.xMin, rect.yMin);
            Vector2 B = new Vector2(rect.xMin, rect.yMax);
            Vector2 C = new Vector2(rect.xMax, rect.yMax);
            Vector2 D = new Vector2(rect.xMax, rect.yMin);

            Vector2 AB = clone(B) - A;
            Vector2 AP = clone(point) - A;
            Vector2 BC = clone(C) - B;
            Vector2 BP = clone(point) - B;

            var dotABAP = Vector2.Dot(AB, AP);
            var dotABAB = Vector2.Dot(AB, AB);
            var dotBCBP = Vector2.Dot(BC, BP);
            var dotBCBC = Vector2.Dot(BC, BC);
            return 0 <= dotABAP && dotABAP <= dotABAB && 0 <= dotBCBP && dotBCBP <= dotBCBC;
        }

        public static float cross(Vector2 rhs, Vector2 lhs)
        {
            return rhs.x * lhs.y - rhs.y * lhs.x;
        }

        public static float signAngle(Vector2 rhs, Vector2 lhs)
        {
            var angle = Vector2.Angle(rhs, lhs);
            return cross(rhs, lhs) < 0 ? -angle : angle;
        }

        public static float vectorLength(float x, float y)
        {
            return math.sqrt(x * x + y * y);
        }

        //cx,cy is center point of the circle 
        public static ValueTuple<bool, Vector2> closestLineCircleIntersection(Vector2 circleCenter, float radius, float lineStartX, float lineStartY, float lineEndX, float lineEndY)
        {
            ValueTuple<bool, Vector2> result = ValueTuple.Create(false, new Vector2());

            var intersections = findLineCircleIntersections(circleCenter, radius, lineStartX, lineStartY, lineEndX, lineEndY);

            if (true == intersections.Item1 && false == intersections.Item3)
            {
                result.Item1 = intersections.Item1;
                result.Item2 = intersections.Item2;
                return result; // one intersection
            }
            else if (false == intersections.Item1 && true == intersections.Item3)
            {
                result.Item1 = intersections.Item3;
                result.Item2 = intersections.Item4;
                return result; // one intersection
            }
            else if (true == intersections.Item1 && true == intersections.Item3)
            {
                float dist1 = vectorLength(lineStartX - intersections.Item2.x, lineStartY - intersections.Item2.y);
                float dist2 = vectorLength(lineStartX - intersections.Item4.x, lineStartY - intersections.Item4.y);

                if (dist1 < dist2)
                {
                    result.Item1 = intersections.Item1;
                    result.Item2 = intersections.Item2;
                    return result;
                }
                else
                {
                    result.Item1 = intersections.Item3;
                    result.Item2 = intersections.Item4;
                    return result;
                }
            }

            return result; // no intersections at all
        }

        // Find the points of intersection.
        public static ValueTuple<bool, Vector2, bool, Vector2> findLineCircleIntersections(Vector2 circleCenter, float radius, float lineStartX, float lineStartY, float lineEndX, float lineEndY)
        {
            ValueTuple<bool, Vector2, bool, Vector2> result = ValueTuple.Create(false, new Vector2(), false, new Vector2());

            float dx = lineEndX - lineStartX;
            float dy = lineEndY - lineStartY;

            float A = math.pow(dx, 2) + math.pow(dy, 2);
            float B = 2 * (dx * (lineStartX - circleCenter.x) + dy * (lineStartY - circleCenter.y));
            float C = math.pow(lineStartX - circleCenter.x, 2) + math.pow(lineStartY - circleCenter.y, 2) - math.pow(radius, 2);

            float det = B * B - 4 * A * C;
            if ((A <= 0.0000001) || (det < 0))
            {
                // No real solutions.
                result.Item1 = false;
                result.Item3 = false;
                return result;
            }
            else if (det == 0)
            {
                // One solution.
                float t = -B / (2 * A);

                if (0 <= t && t <= 1)
                {
                    result.Item1 = true;
                    result.Item2 = new Vector2(lineStartX + t * dx, lineStartY + t * dy);
                }

                return result;
            }
            else
            {
                // Two solutions.
                float t = (-B + math.sqrt(det)) / (2 * A);

                if (0 <= t && t <= 1)
                {
                    result.Item1 = true;
                    result.Item2 = new Vector2(lineStartX + t * dx, lineStartY + t * dy);
                }

                t = (-B - math.sqrt(det)) / (2 * A);

                if (0 <= t && t <= 1)
                {
                    result.Item3 = true;
                    result.Item4 = new Vector2(lineStartX + t * dx, lineStartY + t * dy);
                }

                return result;
            }
        }

        public static bool doesLineIntersectCircle(float x1, float y1, float x2, float y2, Vector2 circleCenter, float circleRadius)
        {
            Vector2 ac = new Vector2(circleCenter.x - x1, circleCenter.y - y1);
            Vector2 ab = new Vector2(x2 - x1, y2 - y1);
            var ab2 = Vector2.Dot(ab, ab);
            var acab = Vector2.Dot(ac, ab);
            var t = acab / ab2;
            t = (t < 0) ? 0 : t;
            t = (t > 1) ? 1 : t;
            Vector2 h = new Vector2((ab.x * t + x1) - circleCenter.x, (ab.y * t + y1) - circleCenter.y);
            var h2 = Vector2.Dot(h, h);
            return h2 <= circleRadius * circleRadius;
        }

        public static bool doesRectangleIntersectsCircle(Rect rect, Vector2 circleCenter, float circleRadius)
        {
            return (isPointInsideRectangle(circleCenter, rect) ||
                    doesLineIntersectCircle(rect.x, rect.y, rect.x, rect.yMax, circleCenter, circleRadius) ||
                    doesLineIntersectCircle(rect.x, rect.yMax, rect.xMax, rect.yMax, circleCenter, circleRadius) ||
                    doesLineIntersectCircle(rect.xMax, rect.yMax, rect.xMax, rect.y, circleCenter, circleRadius) ||
                    doesLineIntersectCircle(rect.xMax, rect.y, rect.x, rect.y, circleCenter, circleRadius));
        }

        public static bool isPointInsideCircle(Vector2 point, Vector2 circleCenter, float circleRadius)
        {
            return isPointInsideCircleOptimized(point.x, point.y, circleCenter, circleRadius);
        }

        public static bool isPointInsideCircleOptimized(float x, float y, Vector2 circleCenter, float circleRadius)
        {
            return math.pow(x - circleCenter.x, 2) + math.pow(y - circleCenter.y, 2) <= math.pow(circleRadius, 2);
        }

        public static ValueTuple<float, float, float, float> normalizeAnglesForCheck(float angleFrom, float angleTo, float checkAngleFrom, float checkAngleTo)
        {
            float finalAngleFrom = 0;
            float finalAngleTo = 0;
            float finalCheckAngleFrom = 0;
            float finalCheckAngleTo = 0;

            bool angleToLessThanAngleFrom = angleTo < angleFrom;
            bool checkAngleToLessThanCheckAngleFrom = checkAngleTo < checkAngleFrom;

            if (true == angleToLessThanAngleFrom &&
               true == checkAngleToLessThanCheckAngleFrom)
            {
                finalAngleFrom = angleFrom;
                finalAngleTo = angleTo + 360;
                finalCheckAngleFrom = checkAngleFrom;
                finalCheckAngleTo = checkAngleTo + 360;
            }
            else if (true == angleToLessThanAngleFrom)
            {
                finalAngleFrom = angleFrom;
                finalAngleTo = angleTo + 360;

                if (checkAngleFrom >= finalAngleFrom &&
                    checkAngleFrom <= 360)
                {
                    finalCheckAngleFrom = checkAngleFrom;
                }
                else
                {
                    finalCheckAngleFrom = checkAngleFrom + 360;
                }

                if (checkAngleTo >= finalAngleFrom &&
                    checkAngleTo <= 360)
                {
                    finalCheckAngleTo = checkAngleTo;
                }
                else
                {
                    finalCheckAngleTo = checkAngleTo + 360;
                }
            }
            else if (true == checkAngleToLessThanCheckAngleFrom)
            {
                finalCheckAngleFrom = checkAngleFrom;
                finalCheckAngleTo = checkAngleTo + 360;

                if (angleFrom >= finalCheckAngleFrom &&
                    angleFrom <= 360)
                {
                    finalAngleFrom = angleFrom;
                }
                else
                {
                    finalAngleFrom = angleFrom + 360;
                }

                if (angleTo >= finalCheckAngleFrom &&
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

            return ValueTuple.Create(finalAngleFrom, finalAngleTo, finalCheckAngleFrom, finalCheckAngleTo);
        }

        public static bool checkAngleRangesCollision(float angleFrom, float angleTo, float checkAngleFrom, float checkAngleTo)
        {
            var normalizationResult = normalizeAnglesForCheck(angleFrom, angleTo, checkAngleFrom, checkAngleTo);

            if (normalizationResult.Item3 >= normalizationResult.Item1 && normalizationResult.Item3 <= normalizationResult.Item2 ||
               normalizationResult.Item4 >= normalizationResult.Item1 && normalizationResult.Item4 <= normalizationResult.Item2 ||
               normalizationResult.Item1 >= normalizationResult.Item3 && normalizationResult.Item1 <= normalizationResult.Item4 ||
               normalizationResult.Item2 >= normalizationResult.Item3 && normalizationResult.Item2 <= normalizationResult.Item4)
            {
                return true;
            }

            return false;
        }

        /////////////////////// Polygon generation algorithm END ///////////////////////

        // Use it if you want to sort vertices by angle without calculating the angles. Works ~2-3 times faster, than angles calculation.
        public static float pseudoangle(float dx, float dy)
        {
            var diag = dx > dy;
            var adiag = dx > -dy;

            float r = !adiag ? 4 : 0;

            if (dy == 0)
                return r;

            if (diag != adiag)
                r += 2 - dx / dy;
            else
                r += dy / dx;

            return r;
        }
    }
}