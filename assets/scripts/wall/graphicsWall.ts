
import { _decorator, Component, Node, Color, Graphics, Vec2, PolygonCollider2D, UITransform, math, PhysicsSystem2D } from 'cc';
import { Maze_Common } from '../common';
import { Maze_EasyReference } from '../easyReference';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('GraphicsWall')
@executeInEditMode
export class GraphicsWall extends Component
{
    @property
    _dimensions:Vec2 = new Vec2(100,100)

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
    _numberOfVertices:number = 4;

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
    _excludeFromCenterFactor:number = 0.5;

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

    @property 
    _debugMode:boolean = false; 

    @property
    set DebugMode(val:boolean)
    {
        this._debugMode = val;
        this.generateVertices();
    }
    get DebugMode() : boolean
    {
        return this._debugMode;
    }

    private _painter:Graphics|null = null;
    private _vertices:Vec2[] = [];
    private _numberOfShownVertices:number = 0;
    private _polygonCollider2DComp:PolygonCollider2D|null = null;
    private _UITransform:UITransform|null = null;

    changeNumberOfShownVertices()
    {
        this._numberOfShownVertices += 1;

        if(this._numberOfShownVertices > this._vertices.length)
        {
            this._numberOfShownVertices = 0;
        }

        this.scheduleOnce(()=>
        {
            this.changeNumberOfShownVertices();
        }, 0.25);
    }

    onLoad()
    {
        this._painter = this.node.getComponent(Graphics);
        this._polygonCollider2DComp = this.node.getComponent(PolygonCollider2D);
        this._UITransform = this.node.getComponent(UITransform);
        
        this.generateVertices(); 

        if(true == this._debugMode)
        {
            this.changeNumberOfShownVertices();
        }

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

        if(null != this._UITransform)
        {
            this._UITransform.contentSize = new math.Size(this._dimensions.x, this._dimensions.y);
        }

        if(null != this._polygonCollider2DComp)
        {
            this._polygonCollider2DComp.points = this._vertices;
        }
    }

    update()
    {
        if(null != this._painter)
        {
            this._painter.clear();

            if(true == this._debugMode)
            {
                var halfDimensions:Vec2 = this._dimensions.clone().multiplyScalar(0.5);

                var leftBottomPoint:Vec2 = new Vec2(0,0);
                leftBottomPoint.x -= halfDimensions.x;
                leftBottomPoint.y -= halfDimensions.y;

                var leftTopPoint:Vec2 = new Vec2(0,0);
                leftTopPoint.x -= halfDimensions.x;
                leftTopPoint.y += halfDimensions.y;

                var rightTopPoint:Vec2 = new Vec2(0,0);
                rightTopPoint.x += halfDimensions.x;
                rightTopPoint.y += halfDimensions.y;

                var rightBottomPoint:Vec2 = new Vec2(0,0);
                rightBottomPoint.x += halfDimensions.x;
                rightBottomPoint.y -= halfDimensions.y;

                this._painter.moveTo(leftBottomPoint.x, leftBottomPoint.y);
                this._painter.color = new Color(255,0,0);
                this._painter.lineTo(leftTopPoint.x, leftTopPoint.y);
                this._painter.lineTo(rightTopPoint.x, rightTopPoint.y);
                this._painter.lineTo(rightBottomPoint.x, rightBottomPoint.y);
                this._painter.lineTo(leftBottomPoint.x, leftBottomPoint.y);

                this._painter.stroke();
            }

            var maxCounter:number = 0;

            if(true == this._debugMode)
            {
                maxCounter = this._numberOfShownVertices;
            }
            else
            {
                maxCounter = this._vertices.length;
            }

            if(this._vertices.length > 0)
            {
                this._painter.moveTo(this._vertices[0].x, this._vertices[0].y);
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

                this._painter.lineWidth = 5;
                this._painter.color = new Color(255,255,255);
                this._painter.lineTo(nextPoint.x, nextPoint.y);

                if(true == this._debugMode)
                {
                    this._painter.circle(nextPoint.x, nextPoint.y, 5);
                }
            }

            this._painter.close();

            this._painter.stroke();

            if(false == this._debugMode)
            {
                this._painter.fillColor = new Color(0,0,0);
                this._painter.fill();
            }
        }
    }
}