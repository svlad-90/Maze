
import { _decorator, Component, Node, Color, Graphics, Vec2, Vec3, PolygonCollider2D, UITransform, math, PhysicsSystem2D, Canvas } from 'cc';
import { Maze_Common } from '../common';
import std from '../thirdparty/tstl/src';
const { ccclass, property, executeInEditMode } = _decorator;

export namespace Maze_GraphicsWall
{
    @ccclass('GraphicsWall')
    @executeInEditMode
    export class GraphicsWall extends Component
    {
        private _drawn:boolean = false;

        @property (Graphics)
        private _sharedGraphics:Graphics|null = null;

        @property (Graphics)
        set SharedGraphics(val:Graphics|null)
        {
            this._sharedGraphics = val;
        }
        get SharedGraphics():Graphics|null
        {
            return this._sharedGraphics;
        }

        @property
        private _dimensions:Vec2 = new Vec2(100,100)

        @property
        set Dimensions(val:Vec2)
        {
            this._dimensions = val;
            this.generateVertices();
        }
        get Dimensions() : Vec2
        {
            return this._dimensions;
        }
    
        @property
        private _numberOfVertices:number = 4;

        @property
        set NumberOfVertices(val:number)
        {
            this._numberOfVertices = val;
            this.generateVertices();
        }
        get NumberOfVertices() : number
        {
            return this._numberOfVertices;
        }

        @property
        private _excludeFromCenterFactor:number = 0.5;

        @property
        set ExcludeFromCenterFactor(val:number)
        {
            this._excludeFromCenterFactor = val;
            this.generateVertices();
        }
        get ExcludeFromCenterFactor() : number
        {
            return this._excludeFromCenterFactor;
        }

        private _vertices:Vec2[] = [];
        get vertices():Vec2[]
        {
            return this._vertices;
        }

        // vertices with angle information. Sorted by angle from -180 to 180
        private _angleVertices:[number,Vec2][] = [];
        get angleVertices():[number,Vec2][]
        {
            return this._angleVertices;
        }

        private _polygonCollider2DComp:PolygonCollider2D|null = null;
        private _UITransform:UITransform|null = null;

        constructor()
        {
            super();
        }

        onLoad()
        {
            this._polygonCollider2DComp = this.node.getComponent(PolygonCollider2D);
            this._UITransform = this.node.getComponent(UITransform);
            
            this.generateVertices(); 

            //PhysicsSystem2D.instance.debugDrawFlags = 1;
        }

        generateVertices()
        {
            var halfDimensions:Vec2 = this._dimensions.clone().multiplyScalar(0.5);
            halfDimensions.x = -halfDimensions.x;
            halfDimensions.y = -halfDimensions.y;

            this._vertices = Maze_Common.generateConvexPolygon(this._dimensions, 
                                                            this._numberOfVertices, 
                                                            this._excludeFromCenterFactor,
                                                            halfDimensions);

            this._angleVertices = [];
            for(var vertex of this.vertices)
            {
                var angle = math.toDegree(Maze_Common.upVector.signAngle(vertex));
                this._angleVertices.push( [Maze_Common.convertSingleAngleToUpVectorTo_0_360(angle), vertex] );
            }

            if(null != this._UITransform)
            {
                this._UITransform.contentSize = new math.Size(this._dimensions.x, this._dimensions.y);
            }

            if(null != this._polygonCollider2DComp)
            {
                this._polygonCollider2DComp.points = this._vertices;
            }
        }

        update(deltaTime:number)
        {
            if(null != this.SharedGraphics)
            {
                if(false == this._drawn)
                {
                    var painter = this.SharedGraphics.node.getComponent(Graphics);

                    if(null != painter)
                    {
                        var shift:Vec3 = this.node.worldPosition.clone().subtract(this.SharedGraphics.node.worldPosition);

                        var maxCounter:number = 0;

                        maxCounter = this._vertices.length;

                        if(this._vertices.length > 0)
                        {
                            painter.moveTo(this._vertices[0].x + shift.x, this._vertices[0].y + shift.y);
                        }

                        for(var i:number = 0; i < maxCounter; ++i)
                        {
                            var currentPoint = this._vertices[i];
                            var nextPoint:Vec2|null = null; 

                            if(i < this._vertices.length-1)
                            {
                                nextPoint = this._vertices[i+1];
                            }
                            else
                            {
                                nextPoint = this._vertices[0];
                            }

                            painter.lineWidth = 5;
                            painter.color = new Color(255,255,255);
                            painter.lineTo(nextPoint.x + shift.x, nextPoint.y + shift.y);
                        }

                        painter.close();

                        painter.stroke();

                        painter.fillColor = new Color(0,0,0);
                        painter.fill();

                        this._drawn = true;
                    }
                }
            }
        }
    }
}