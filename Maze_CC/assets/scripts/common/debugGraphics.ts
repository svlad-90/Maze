
import { _decorator, Component, Node, Graphics, math, UITransform, Vec3, Vec2, Color, TERRAIN_HEIGHT_BASE, Layers } from 'cc';
import { Maze_Common } from '../common';

export namespace Maze_DebugGraphics
{
    const EPSILON:number = 0.0000000001;

    function area( polygon_nodes:[number,number][] ):number
    {
        var n = polygon_nodes.length;
        var A:number = 0;
    
        for ( var p = n - 1, q = 0; q<n; p = q++ )
            A += (polygon_nodes[p][0] * polygon_nodes[q][1]) - (polygon_nodes[q][0] * polygon_nodes[p][1]);
    
        return A * 0.5;
    }

    function insideTriangle
    (Ax:number, Ay:number,
     Bx:number, By:number,
     Cx:number, Cy:number,
     Px:number, Py:number):boolean
    {
        var ax:number = 0; 
        var ay:number = 0; 
        var bx:number = 0; 
        var by:number = 0; 
        var cx:number = 0; 
        var cy:number = 0; 
        var apx:number = 0; 
        var apy:number = 0; 
        var bpx:number = 0; 
        var bpy:number = 0; 
        var cpx:number = 0; 
        var cpy:number = 0;

        var cCROSSap:number = 0;
        var bCROSScp:number = 0;
        var aCROSSbp:number = 0;

        ax  = Cx - Bx;  ay  = Cy - By;
        bx  = Ax - Cx;  by  = Ay - Cy;
        cx  = Bx - Ax;  cy  = By - Ay;
        apx = Px - Ax;  apy = Py - Ay;
        bpx = Px - Bx;  bpy = Py - By;
        cpx = Px - Cx;  cpy = Py - Cy;

        aCROSSbp = ax*bpy - ay*bpx;
        cCROSSap = cx*apy - cy*apx;
        bCROSScp = bx*cpy - by*cpx;

        return ((aCROSSbp >= 0.0) && (bCROSScp >= 0.0) && (cCROSSap >= 0.0));
    }

    function snip( contour:[number,number][], u:number, v:number, w:number, n:number, V:number[] ):boolean
    {
        var Ax:number = 0;
        var Ay:number = 0;
        var Bx:number = 0;
        var By:number = 0;
        var Cx:number = 0;
        var Cy:number = 0;
        var Px:number = 0;
        var Py:number = 0;

        Ax = contour[V[u]][0];
        Ay = contour[V[u]][1];

        Bx = contour[V[v]][0];
        By = contour[V[v]][1];

        Cx = contour[V[w]][0];
        Cy = contour[V[w]][1];

        if ( EPSILON > (((Bx - Ax)*(Cy - Ay)) - ((By - Ay)*(Cx - Ax))) )
            return false;

        var p:number = 0;
        for ( p = 0; p<n; p++ )
        {
            if ( (p == u) || (p == v) || (p == w) ) continue;
            Px = contour[V[p]][0];
            Py = contour[V[p]][1];
            if ( insideTriangle( Ax, Ay, Bx, By, Cx, Cy, Px, Py ) ) 
            {
                return false;
            }
        }

        return true;
    }

    function process( polygon_verts:[number,number][], triangle_verts:[number,number][] ):boolean
    {
        // allocate and initialize list of Vertices in polygon 
        var n:number = polygon_verts.length;
        if ( n < 3 ) return false;

        var V:number[] = [];

        for(var i = 0; i < n; ++i)
        {
            V.push(0);
        }

        // we want a counter-clockwise polygon in V 
        if ( 0.0 < area(polygon_verts) )
            for ( var v:number = 0; v < n; v++ )
                V[v] = v;
        else
            for ( var v:number = 0; v < n; v++ )
                V[v] = (n-1) - v;

        var nv:number = n;

        //  remove nv-2 Vertices, creating 1 triangle every time
        var count:number = 3 * nv;   // error detection

        for ( var m:number = 0, v = nv - 1; nv>2; )
        {
            // If we loop, it is probably a non-simple polygon
            if ( 0 >= (count--) )
                return false; // Triangulate: ERROR - probable bad polygon!

            // three consecutive vertices in current polygon, <u,v,w>
            var u:number = v; if ( nv <= u ) u = 0;         // previous
            v = u + 1; if ( nv <= v ) v = 0;                // new v
            var w:number = v + 1; if ( nv <= w ) w = 0;     // next

            if ( snip(polygon_verts, u, v, w, nv, V) )
            {
                var a:number = 0;
                var b:number = 0;
                var c:number = 0;
                var s:number = 0;
                var t:number = 0;

                // true names of the vertices
                a = V[u]; b = V[v]; c = V[w];

                // output Triangle
                triangle_verts.push( polygon_verts[a] );
                triangle_verts.push( polygon_verts[b] );
                triangle_verts.push( polygon_verts[c] );

                m++;

                // remove v from remaining polygon
                for ( s = v, t = v + 1; t<nv; s++, t++ )
                    V[s] = V[t]; nv--;

                // reset error detection counter
                count = 3 * nv;
            }
        }

        return true;
    }

    function processCircleBasedPolygon( polygon_verts:[number,number][], triangle_verts:[number,number][], center:Vec2 )
    {
        var sortVertices = (collection:[number,number][])=>
        {
            // we need to sort vertices by angle
            collection.sort((a:[number,number], b:[number,number]) => 
            {
                return Maze_Common.pseudoangle(a[0] - center.x, a[1] - center.y) - Maze_Common.pseudoangle(b[0] - center.x, b[1] - center.y);
            });
        };

        sortVertices(polygon_verts);

        if(polygon_verts.length >= 2)
        {
            for(var counter = 0; counter < polygon_verts.length; ++counter)
            {
                if(counter == polygon_verts.length - 1)
                {
                    triangle_verts.push([center.x, center.y]);
                    triangle_verts.push(polygon_verts[counter]);
                    triangle_verts.push(polygon_verts[0]);
                }
                else
                {
                    triangle_verts.push([center.x, center.y]);
                    triangle_verts.push(polygon_verts[counter]);
                    triangle_verts.push(polygon_verts[counter+1]);
                }
            }
        }
        else
        {
            throw("[Maze_DebugGraphics.process] Error! Wrong parameters!");
        }
    }

    export class DebugGraphics
    {
        private _graphicsNode:Node = new Node();
        private _graphics:Graphics;
        private _uiTransform:UITransform;

        get internalGraphics():Graphics
        {
            return this._graphics;
        }

        constructor(parent:Node|null, layer = Layers.Enum.UI_2D)
        {
            this.parent = parent;

            this._graphicsNode.addComponent(Graphics);
            this._graphicsNode.layer = layer;

            var graphics = this._graphicsNode.getComponent(Graphics);

            if(null != graphics)
            {
                this._graphics = graphics;
            }
            else
            {
                throw("Error! Was not able to assign Graphics component!");
            }

            var uiTransform = this._graphicsNode.getComponent(UITransform);

            if(null != uiTransform)
            {
                this._uiTransform = uiTransform
            }
            else
            {
                throw("Error! Was not able to assign UITransform component!");
            }
        }

        set parent(val:Node|null)
        {
            if(null != this._graphicsNode.parent)
            {
                this._graphicsNode.parent.removeChild(this._graphicsNode);
            }

            this._graphicsNode.parent = val;

            if(null != val)
            {
                val.addChild(this._graphicsNode);
            }
        }
        get parent():Node|null
        {
            return this._graphicsNode.parent;
        }

        get lineWidth(): number
        {
            return this._graphics.lineWidth;
        }

        set lineWidth(value: number)
        {
            this._graphics.lineWidth = value;
        }
        
        get strokeColor(): Readonly<math.Color>
        {
            return this._graphics.strokeColor;
        }

        set strokeColor(value: Readonly<math.Color>)
        {
            this._graphics.strokeColor = value;
        }

        get fillColor(): Readonly<math.Color>
        {
            return this._graphics.fillColor;
        }

        set fillColor(value: Readonly<math.Color>)
        {
            this._graphics.fillColor = value;
        }

        get miterLimit(): number
        {
            return this._graphics.miterLimit;
        }

        set miterLimit(value: number)
        {
            this._graphics.miterLimit = value;
        }

        get color(): math.Color
        {
            return this._graphics.color;
        }

        set color(value: math.Color)
        {
            this._graphics.color = value;
        }

        get srcBlendFactor(): import("cocos/core/gfx").BlendFactor
        {
            return this._graphics.srcBlendFactor;
        }

        set srcBlendFactor(value: import("cocos/core/gfx").BlendFactor)
        {
            this._graphics.srcBlendFactor = value;
        }

        get dstBlendFactor(): import("cocos/core/gfx").BlendFactor
        {
            return this._graphics.dstBlendFactor;
        }

        set dstBlendFactor(value: import("cocos/core/gfx").BlendFactor)
        {
            this._graphics.dstBlendFactor = value;
        }

        onRestore(): void
        {
            this._graphics.onRestore();
        }

        onLoad(): void
        {
            this._graphics.onLoad();
        }

        onEnable(): void
        {
            this._graphics.onEnable();
        }

        onDisable(): void
        {
            this._graphics.onDisable();
        }

        onDestroy(): void
        {
            this._graphics.onDestroy();
        }

        moveTo(x: number, y: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.moveTo(localPosition.x, localPosition.y);
        }

        lineTo(x: number, y: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.lineTo(localPosition.x, localPosition.y);
        }

        bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void
        {
            var localPosition1 = this._uiTransform.convertToNodeSpaceAR(new Vec3(c1x,c1y,0));
            var localPosition2 = this._uiTransform.convertToNodeSpaceAR(new Vec3(c2x,c2y,0));
            var localPosition3 = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.bezierCurveTo(localPosition1.x, localPosition1.y, localPosition2.x, localPosition2.y, localPosition3.x, localPosition3.y);
        }

        quadraticCurveTo(cx: number, cy: number, x: number, y: number): void
        {
            var localPosition1 = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            var localPosition2 = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.quadraticCurveTo(localPosition1.x, localPosition1.y, localPosition2.x, localPosition2.y);
        }

        arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, counterclockwise: boolean): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.arc(localPosition.x, localPosition.y, r, startAngle, endAngle, counterclockwise);
        }

        ellipse(cx: number, cy: number, rx: number, ry: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.ellipse(localPosition.x, localPosition.y, rx, ry);
        }

        circle(cx: number, cy: number, r: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.circle(localPosition.x, localPosition.y, r * this._graphicsNode.scale.x);
        }

        rect(x: number, y: number, w: number, h: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.rect(localPosition.x, localPosition.y, w, h);
        }

        roundRect(x: number, y: number, w: number, h: number, r: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.roundRect(localPosition.x, localPosition.y, w, h, r);
        }

        fillRect(x: any, y: any, w: any, h: any): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.fillRect(localPosition.x, localPosition.y, w, h);
        }

        clear(): void
        {
            this._graphics.clear();
        }

        close(): void
        {
            this._graphics.close();
        }

        stroke(): void
        {
            this._graphics.stroke();
        }

        fill(): void
        {
            this._graphics.fill();
        }

        activeSubModel(idx: number): void
        {
            this._graphics.activeSubModel(idx);
        }

        private _filling:boolean = false;
        private _fillVerts:[number,number][] = [];
        private _triangulatedVerts:[number,number][] = [];
        private _mPenPos:Vec2 = new Vec2();
        private _center:Vec2 = new Vec2();
        private _circleBasedPolygon:boolean = false;

        begin_trinagulatedFilledShape(center:Vec2, circleBasedPolygon:boolean)
        {
            this._center = center;
        	this._filling = true;
            this._circleBasedPolygon = circleBasedPolygon;
        }

        end_triangulatedFilledShape(fillColour:Color)
        {
        	if ( true == this._filling )
        	{
        		this._filling = false;

                if ( this._fillVerts.length <= 4 )
                {
        		    this.moveTo(this._fillVerts[0][0], this._fillVerts[0][1]);
                    this.lineTo(this._fillVerts[1][0], this._fillVerts[1][1]);
                    this.lineTo(this._fillVerts[2][0], this._fillVerts[2][1]);
                    this.lineTo(this._fillVerts[0][0], this._fillVerts[0][1]);
                    this.close();
                    this.fillColor = fillColour;
                    this.fill();
                }
                else
                {
                    // Triangulate polygon verts
                    if(true == this._circleBasedPolygon)
                    {
                        processCircleBasedPolygon( this._fillVerts, this._triangulatedVerts, this._center );
                    }
                    else
                    {
                        process( this._fillVerts, this._triangulatedVerts );
                    }

                    var count:number = this._triangulatedVerts.length / 3;
                    for ( var i:number = 0; i < count; i++ )
                    {
                        var p1:[number,number] = this._triangulatedVerts[i*3];
                        var p2:[number,number] = this._triangulatedVerts[i*3+1];
                        var p3:[number,number] = this._triangulatedVerts[i*3+2];

                        this.moveTo(p1[0], p1[1]);
                        this.lineTo(p2[0], p2[1]);
                        this.lineTo(p3[0], p3[1]);
                        this.lineTo(p1[0], p1[1]);
                        this.close();

                        if(true) // Try switching this to 0 to visualize each triangle as a random color - useful to judge efficiency
                        {
                            this.fillColor = fillColour;   
                        }
                        else
                        {
                            this.fillColor = new Color(math.randomRangeInt(0,256), math.randomRangeInt(0,256), math.randomRangeInt(0,256));
                        }
                        
                        this.fill();
                    }
                    
                    this._triangulatedVerts = [];
                }

                this._fillVerts = [];
        	}
        }

        moveTo_trinagulatedFilledShape( x:number, y:number )
        {
            if ( true == this._filling )
            {
                this._fillVerts = [];
                this._fillVerts.push( [x, y] );
            }
        }

        lineTo_trinagulatedFilledShape( x:number, y:number )
        {
        	if ( true == this._filling )
            {
                this._fillVerts.push( [x, y] );
            }
        }

        clear_trinagulatedFilledShape()
        {
        	this._graphics.clear();
        	this._fillVerts = [];
            this._triangulatedVerts = [];
        	this._filling = false;
            this._center = new Vec2();
            this._circleBasedPolygon = false;
        }
    }
}