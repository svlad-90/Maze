
import { _decorator, Component, Node, Color, Graphics, Vec2, Vec3, PolygonCollider2D, UITransform, math, PhysicsSystem2D, Canvas, RigidBody2D, Contact2DType,
    Collider2D, IPhysics2DContact, Material } from 'cc';
import { Maze_Common } from '../common';
import { Maze_DebugGraphics } from '../common/debugGraphics';
import std from '../thirdparty/tstl/src';
const { ccclass, property, executeInEditMode } = _decorator;

export namespace Maze_GraphicsWall
{
    export class WallRegistryItem extends Component
    {
        private static _instances:number = 0;
        protected wall_id:number = GraphicsWall._instances++;
    }

    @ccclass('GraphicsWall')
    @executeInEditMode
    export class GraphicsWall extends WallRegistryItem
    {
        private _drawn:boolean = false;
        public set drawn(val:boolean)
        {
            this._drawn = val;
        }

        private _graphics:Maze_DebugGraphics.DebugGraphics|null = null;

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

        private _lightingMaterial:Material|null = null;
        set lightingMaterial (val:Material|null)
        {
            this._lightingMaterial = val;

            if(null != this._graphics)
            {
                if(null != this._lightingMaterial)
                {
                    //this._lightingMaterial.setProperty("wall_id", this.wall_id);
                }

                this._graphics.internalGraphics.customMaterial = this._lightingMaterial;
            }
        }
        get lightingMaterial():Material|null
        {
            return this.lightingMaterial;
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
        private _rigidBody:RigidBody2D|null = null;

        constructor()
        {
            super();
        }

        onLoad()
        {
            this._polygonCollider2DComp = this.node.getComponent(PolygonCollider2D);
            this._UITransform = this.node.getComponent(UITransform);
            this._rigidBody = this.node.getComponent(RigidBody2D);

            this._graphics = new Maze_DebugGraphics.DebugGraphics(this.node, 4);

            if(null != this._lightingMaterial)
            {
                this._graphics.internalGraphics.customMaterial = this._lightingMaterial;
            }

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

            if(null != this._rigidBody)
            {
                this._rigidBody.sleep();
            }
        }

        update(deltaTime:number)
        {
            if(null != this._graphics)
            {
                if(false == this._drawn)
                {
                    this._graphics.clear();

                    var shift:Vec3 = this.node.worldPosition;

                    var maxCounter:number = 0;

                    maxCounter = this._vertices.length;

                    this._graphics.lineWidth = 10;
                    this._graphics.strokeColor = new Color(255,255,255);

                    if(this._vertices.length > 0)
                    {
                        this._graphics.moveTo(this._vertices[0].x + shift.x, this._vertices[0].y + shift.y);
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

                        this._graphics.lineTo(nextPoint.x + shift.x, nextPoint.y + shift.y);
                        this._graphics.stroke();
                    }

                    this._graphics.close();

                    this._graphics.fillColor = new Color(30,0,0);
                    this._graphics.fill();

                    this._drawn = true;
                }
            }
        }
    }
}