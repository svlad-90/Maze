import { _decorator, Component, Node, Prefab, Vec2, instantiate, Vec3, UITransform, Graphics, ResolutionPolicy, 
    math, randomRangeInt, Label, Rect, PhysicsSystem2D, ERaycast2DType, Line, Color, Sprite, NodePool } from 'cc';
import { Maze_GraphicsWall } from '../wall/graphicsWall';
import { Maze_MazeGenerator } from '../maze/mazeGenerator';
import { Maze_PriorityQueue } from '../common/priorityQueue/priorityQueue.ts';
import { Maze_Common } from '../common';
import { Maze_DebugGraphics } from '../common/debugGraphics';
import { Maze_EasyReference } from '../easyReference';
import std from '../thirdparty/tstl/src';
const { ccclass, property } = _decorator;

export namespace Maze_MapBuilder
{
    class MapNodePrioritized
    {
        mapNode:MapNode;
        priority:number;

        constructor(mapNode:MapNode, priority:number)
        {
            this.mapNode = mapNode;
            this.priority = priority;
        }
    };

    enum eNeighbourType
    {
        TOP = 0,
        RIGHT = 1,
        BOTTOM = 2,
        LEFT = 3
    }

    class MapNode
    {
        private _x:number;
        public get x():number
        {
            return this._x;
        }

        private _y:number;
        public get y():number
        {
            return this._y;
        }

        private _tileCoord:Vec2;
        public get tileCoord():Vec2
        {
            return this._tileCoord;
        }

        constructor(x:number, y:number)
        {
            this._x = x;
            this._y = y;
            this._tileCoord = new Vec2(this._x, this._y);
        }

        private _topSibling:MapNode|null = null;
        public set topSibling(val:MapNode|null)
        {
            this._topSibling = val;
        }
        public get topSibling():MapNode|null
        {
            return this._topSibling;
        }

        private _rightSibling:MapNode|null = null;
        public set rightSibling(val:MapNode|null)
        {
            this._rightSibling = val;
        }
        public get rightSibling():MapNode|null
        {
            return this._rightSibling;
        }
        
        private _bottomSibling:MapNode|null = null;
        public set bottomSibling(val:MapNode|null)
        {
            this._bottomSibling = val;
        }
        public get bottomSibling():MapNode|null
        {
            return this._bottomSibling;
        }

        private _leftSibling:MapNode|null = null;
        public set leftSibling(val:MapNode|null)
        {
            this._leftSibling = val;
        }
        public get leftSibling():MapNode|null
        {
            return this._leftSibling;
        }

        private _isWalkable:boolean = true;
        public set isWalkable(val:boolean)
        {
            this._isWalkable = val;
        }
        public get isWalkable():boolean
        {
            return this._isWalkable;
        }

        private _representationNode:Node|null = null;
        public set representationNode(val:Node|null)
        {
            this._representationNode = val;
            if(null != this._representationNode)
            {
                this._graphicsWall = this._representationNode.getComponent(Maze_GraphicsWall.GraphicsWall);
                this._sprite = this._representationNode.getComponent(Sprite);
            }
        }
        public get representationNode():Node|null
        {
            return this._representationNode;
        }

        private _graphicsWall:Maze_GraphicsWall.GraphicsWall|null = null;
        public get graphicsWall():Maze_GraphicsWall.GraphicsWall|null
        {
            return this._graphicsWall;
        }

        private _sprite:Sprite|null = null;
        public get sprite():Sprite|null
        {
            return this._sprite;
        }

        private _label:Node|null = null;
        public set label(val:Node|null)
        {
            this._label = val;
        }
        public get label():Node|null
        {
            return this._label;
        }

        private _visited:boolean = false;
        public set visited(val:boolean)
        {
            this._visited = val;
        }
        public get visited():boolean
        {
            return this._visited;
        }

        public get cost():number
        {
            return 1;
        }

        public getAllNotVisitedNeighbours():Map<eNeighbourType,MapNode>
        {
            var neighbours:Map<eNeighbourType,MapNode> = new Map<eNeighbourType,MapNode>();

            if(null != this.leftSibling && false == this.leftSibling.visited)
            {
                neighbours.set(eNeighbourType.LEFT, this.leftSibling);
            }

            if(null != this.rightSibling && false == this.rightSibling.visited)
            {
                neighbours.set(eNeighbourType.RIGHT, this.rightSibling);
            }

            if(null != this.topSibling && false == this.topSibling.visited)
            {
                neighbours.set(eNeighbourType.TOP, this.topSibling);
            }

            if(null != this.bottomSibling && false == this.bottomSibling.visited)
            {
                neighbours.set(eNeighbourType.BOTTOM, this.bottomSibling);
            }

            return neighbours;
        }

        public getAllVisitedNeighbours():Map<eNeighbourType,MapNode>
        {
            var neighbours:Map<eNeighbourType,MapNode> = new Map<eNeighbourType,MapNode>();

            if(null != this.leftSibling && true == this.leftSibling.visited)
            {
                neighbours.set(eNeighbourType.LEFT, this.leftSibling);
            }

            if(null != this.rightSibling && true == this.rightSibling.visited)
            {
                neighbours.set(eNeighbourType.RIGHT, this.rightSibling);
            }

            if(null != this.topSibling && true == this.topSibling.visited)
            {
                neighbours.set(eNeighbourType.TOP, this.topSibling);
            }

            if(null != this.bottomSibling && true == this.bottomSibling.visited)
            {
                neighbours.set(eNeighbourType.BOTTOM, this.bottomSibling);
            }

            return neighbours;
        }

        public getRandomNotVisitedNeighbour():[eNeighbourType,MapNode]|undefined
        {
            var neighbours = this.getAllNotVisitedNeighbours();

            if(neighbours.size > 0)
            {
                var targetIndex = randomRangeInt(0, neighbours.size);
                var i:number = 0;
                for(var neighbourInfo of neighbours)
                {
                    if(i == targetIndex)
                    {
                        return neighbourInfo;
                        break;
                    }
                    
                    i += 1;
                }
            }
            else
            {
                return undefined;
            }
        }

        public getRandomVisitedNeighbour():[eNeighbourType,MapNode]|undefined
        {
            var neighbours = this.getAllVisitedNeighbours();

            if(neighbours.size > 0)
            {
                var targetIndex = randomRangeInt(0, neighbours.size);
                var i:number = 0;
                for(var neighbourInfo of neighbours)
                {
                    if(i == targetIndex)
                    {
                        return neighbourInfo;
                        break;
                    }
                    
                    i += 1;
                }
            }
            else
            {
                return undefined;
            }
        }
    }

    class LevelMap
    {
        private _mapNodes:MapNode[][] = [];
        public get MapNodes():MapNode[][]
        {
            return this._mapNodes;
        }

        private _parentNode:Node;
        private _width:number; 
        private _height:number;
        private _mapNodeSize:number;
        private _floorPrefab:Prefab;
        private _wallPrefab:Prefab;
        private _sharedGraphics:Graphics;
        private _circleRays:Vec2[] = [];
        private _easyReference:Maze_EasyReference.EasyReference|null = null;
        private _nodePoolMap:std.TreeMap<String, NodePool> = new std.TreeMap<String, NodePool>();
        private _defaultGraphicsWallNode:Node|null = null;
        private _defaultGraphicsWall:Maze_GraphicsWall.GraphicsWall|null = null;

        private generateMaze()
        {
            this.resetVisitFlag();
            
            // We need to check what would be the effective size of the maze, that we are working with.
            // Only 2*y + 1 rows and 2*x + 1 columns would be used in generation 
            var effectiveWidth:number = 0;
            var effectiveHeight:number = 0;

            if(this._width > 0 && this._height > 0)
            {
                effectiveWidth = this._width % 2 == 0 ? this._width - 1 : this._width;
                effectiveHeight = this._height % 2 == 0 ? this._height - 1 : this._height;

                if(effectiveWidth > 0 && effectiveHeight > 0)
                {
                    var widthInCells:number = (effectiveWidth-1)/2;
                    var heightInCells:number = (effectiveWidth-1)/2;

                    if(widthInCells > 0 && heightInCells > 0)
                    {
                        // we can start generation at this point
                        var maze = Maze_MazeGenerator.generateMaze(widthInCells,heightInCells);

                        if(maze.length == heightInCells)
                        {
                            // fill in the walkable data
                            for(var row:number = 0; row < maze.length; ++row)
                            {
                                if(maze[row].length == widthInCells)
                                {
                                    for(var column:number = 0; column < maze[row].length; ++column)
                                    {
                                        // READY
                                        if(false == this.MapNodes[row*2][column*2].visited)
                                        {
                                            this.MapNodes[row*2][column*2].isWalkable = !(maze[row][column].leftWall || maze[row][column].topWall);

                                            var leftSibling = maze[row][column].leftSibling

                                            if(null != leftSibling && true == this.MapNodes[row*2][column*2].isWalkable)
                                            {
                                                this.MapNodes[row*2][column*2].isWalkable = !leftSibling.topWall;

                                                var topSibling = leftSibling.topSibling;

                                                if(null != topSibling && true == this.MapNodes[row*2][column*2].isWalkable)
                                                {
                                                    this.MapNodes[row*2][column*2].isWalkable = !topSibling.rightWall;
                                                }
    
                                            }
                                           
                                            this.MapNodes[row*2][column*2].visited          = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2][column*2+1].visited)
                                        {
                                            this.MapNodes[row*2][column*2+1].isWalkable     = !(maze[row][column].topWall);
                                            this.MapNodes[row*2][column*2+1].visited        = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2][column*2+2].visited)
                                        {
                                            this.MapNodes[row*2][column*2+2].isWalkable     = !(maze[row][column].topWall || maze[row][column].rightWall);

                                            var rightSibling = maze[row][column].rightSibling;

                                            if(null != rightSibling && true == this.MapNodes[row*2][column*2+2].isWalkable)
                                            {
                                                this.MapNodes[row*2][column*2+2].isWalkable = !rightSibling.topWall;

                                                var topSibling = rightSibling.topSibling;

                                                if(null != topSibling && true == this.MapNodes[row*2][column*2+2].isWalkable)
                                                {
                                                    this.MapNodes[row*2][column*2].isWalkable = !topSibling.leftWall;
                                                }
                                            }

                                            this.MapNodes[row*2][column*2+2].visited        = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+1][column*2].visited)
                                        {
                                            this.MapNodes[row*2+1][column*2].isWalkable     = !(maze[row][column].leftWall);
                                            this.MapNodes[row*2+1][column*2].visited        = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+1][column*2+1].visited)
                                        {
                                            this.MapNodes[row*2+1][column*2+1].isWalkable   = true;
                                            this.MapNodes[row*2+1][column*2+1].visited      = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+1][column*2+2].visited)
                                        {
                                            this.MapNodes[row*2+1][column*2+2].isWalkable   = !(maze[row][column].rightWall);
                                            this.MapNodes[row*2+1][column*2+2].visited      = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+2][column*2].visited)
                                        {
                                            this.MapNodes[row*2+2][column*2].isWalkable     = !(maze[row][column].leftWall || maze[row][column].bottomWall);

                                            var leftSibling = maze[row][column].leftSibling;

                                            if(null != leftSibling && true == this.MapNodes[row*2+2][column*2].isWalkable)
                                            {
                                                this.MapNodes[row*2+2][column*2].isWalkable = !leftSibling.bottomWall;

                                                var bottomSibling = leftSibling.bottomSibling;

                                                if(null != bottomSibling && true == this.MapNodes[row*2+2][column*2].isWalkable)
                                                {
                                                    this.MapNodes[row*2+2][column*2].isWalkable = !bottomSibling.rightWall;
                                                }
                                            }

                                            this.MapNodes[row*2+2][column*2].visited        = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+2][column*2+1].visited)
                                        {
                                            this.MapNodes[row*2+2][column*2+1].isWalkable   = !(maze[row][column].bottomWall);
                                            this.MapNodes[row*2+2][column*2+1].visited      = true;
                                        }

                                        // READY
                                        if(false == this.MapNodes[row*2+2][column*2+2].visited)
                                        {
                                            this.MapNodes[row*2+2][column*2+2].isWalkable   = !(maze[row][column].bottomWall || maze[row][column].rightWall);

                                            var rightSibling = maze[row][column].rightSibling;

                                            if(null != rightSibling && true == this.MapNodes[row*2+2][column*2+2].isWalkable)
                                            {
                                                this.MapNodes[row*2+2][column*2+2].isWalkable = !rightSibling.bottomWall;

                                                var bottomSibling = rightSibling.bottomSibling;

                                                if(null != bottomSibling && true == this.MapNodes[row*2+2][column*2+2].isWalkable)
                                                {
                                                    this.MapNodes[row*2+2][column*2+2].isWalkable = !bottomSibling.leftWall;
                                                }
                                            }

                                            this.MapNodes[row*2+2][column*2+2].visited      = true;
                                        }
                                    }
                                }
                                else
                                {
                                    throw("maze[row].length != widthInCells");
                                }
                            }
                        }
                        else
                        {
                            throw("maze.length != widthInCells");
                        }
                    }
                }
            }
        }

        constructor( parentNode:Node, 
            sharedGraphics:Graphics, 
            width:number, 
            height:number, 
            mapNodeSize:number, 
            floorPrefab:Prefab, 
            wallPrefab:Prefab, 
            debug:boolean )
        {
            this._easyReference = new Maze_EasyReference.EasyReference(parentNode);

            var iMax = 72;
            for(var i = 0; i < iMax; ++i)
            {
                var circleVector = Maze_Common.upVector.clone().rotate(math.toRadian(i * (360 / iMax)));
                this._circleRays.push(circleVector);
            }

            if(null != sharedGraphics)
            {
                sharedGraphics.clear();
            }

            this._parentNode = parentNode;
            this._width = width;
            this._height = height;
            this._mapNodeSize = mapNodeSize;
            this._floorPrefab = floorPrefab;
            this._wallPrefab = wallPrefab;
            this._sharedGraphics = sharedGraphics;

            // create all nodes
            for(var row:number = 0; row < height; ++row)
            {
                this._mapNodes.push([]);

                for(var column:number = 0; column < width; ++column)
                {
                    var mapNode = new MapNode(column, row);
                
                    mapNode.isWalkable = false; // all are the walls from the beginning
                    
                    this._mapNodes[row].push(mapNode);
                }
            }

            // assign nodes to each other
            for(var row:number = 0; row < height; ++row)
            {
                for(var column:number = 0; column < width; ++column)
                {
                    if(row > 0)
                    {
                        this._mapNodes[row][column].topSibling = this._mapNodes[row-1][column];
                    }

                    if(column > 0)
                    {
                        this._mapNodes[row][column].leftSibling = this._mapNodes[row][column-1];
                    }

                    if(row < (height - 1))
                    {
                        this._mapNodes[row][column].bottomSibling = this._mapNodes[row+1][column];
                    }

                    if(column != (width - 1))
                    {
                        this._mapNodes[row][column].rightSibling = this._mapNodes[row][column+1];
                    }
                }
            }

            this._defaultGraphicsWallNode = new Node();
            this._defaultGraphicsWallNode.addComponent(Maze_GraphicsWall.GraphicsWall);
            this._defaultGraphicsWallNode.active = false;
            this._defaultGraphicsWallNode.parent = parentNode;
            parentNode.addChild(this._defaultGraphicsWallNode);
            this._defaultGraphicsWall = this._defaultGraphicsWallNode.getComponent(Maze_GraphicsWall.GraphicsWall);

            if(null != this._defaultGraphicsWall)
            {
                this._defaultGraphicsWall.Dimensions = new Vec2(this._mapNodeSize, this._mapNodeSize);
                this._defaultGraphicsWall.SharedGraphics = this._sharedGraphics;
                this._defaultGraphicsWall.ExcludeFromCenterFactor = 1;
                this._defaultGraphicsWall.NumberOfVertices = 4;
            }
            else
            {
                throw("Error! this._defaultGraphicsWallNode == null!");
            }

            // generate maze
            this.generateMaze();

            // create representation nodes
            this.determineVisibleCells();

            if(true == debug)
            {
                for(var row:number = 0; row < height; ++row)
                {
                    for(var column:number = 0; column < width; ++column)
                    {
                        var mapNode = this.MapNodes[row][column];

                        var leftBottomPoint = this.getLeftBottompWorldPosition();

                        var x = leftBottomPoint.x + ( mapNode.x * this._mapNodeSize ) + ( this._mapNodeSize / 2 );
                        var y = leftBottomPoint.y + ( ( this._height - mapNode.y ) * this._mapNodeSize ) + ( this._mapNodeSize / 2 );

                        mapNode.label = new Node();
                        this._parentNode.addChild(mapNode.label);
                        mapNode.label.parent = this._parentNode;
                        mapNode.label.addComponent(Label);
                        mapNode.label.setWorldPosition(new Vec3( x, y, 0  )); 

                        var label = mapNode.label.getComponent(Label);

                        if(null != label)
                        {
                            label.string = String(mapNode.x) + ", " + String(mapNode.y);
                        }
                    }
                }
            }
        }

        protected getNodePool(mapNode:MapNode):NodePool|null
        {
            var result:NodePool|null = null;

            if(null != mapNode)
            {
                var poolName = "";

                if(true == mapNode.isWalkable)
                {
                    if(null != this._floorPrefab)
                    {
                        poolName = this._floorPrefab.data.name;
                    }
                }
                else
                {
                    if(null != this._wallPrefab)
                    {
                        poolName = this._wallPrefab.data.name;
                    }
                }

                if(poolName.length > 0)
                {
                    if(this._nodePoolMap.has(poolName))
                    {
                        result = this._nodePoolMap.get(poolName);
                    }
                    else
                    {
                        result = new NodePool();
                        this._nodePoolMap.set(poolName,result);
                    }
                }
            }

            return result;
        }

        protected assignRepresentationNode(mapNode:MapNode)
        {
            var representationNodeInstance:Node|null = null;

            if(null != mapNode && null == mapNode.representationNode)
            {
                var nodePool = this.getNodePool(mapNode);

                if(null != nodePool)
                {
                    if(0 != nodePool.size())
                    {
                        representationNodeInstance = nodePool.get();
                    }
                    else
                    {
                        if(mapNode.isWalkable)
                        {
                            if(null != this._floorPrefab)
                            {
                                representationNodeInstance = instantiate(this._floorPrefab);

                                var uiTransform = representationNodeInstance.getComponent(UITransform);
                        
                                if(uiTransform != null)
                                {
                                    uiTransform.setContentSize( this._mapNodeSize, this._mapNodeSize );
                                }
                            }
                            else
                            {
                                throw("Error! this._floorPrefab == null");
                            }
                        }
                        else
                        {
                            if(null != this._wallPrefab)
                            {
                                representationNodeInstance = instantiate(this._wallPrefab);

                                var graphicsWall = representationNodeInstance.getComponent(Maze_GraphicsWall.GraphicsWall);
                        
                                if(graphicsWall != null)
                                {
                                    graphicsWall.Dimensions = new Vec2(this._mapNodeSize, this._mapNodeSize);
                                    graphicsWall.SharedGraphics = this._sharedGraphics;
                                    graphicsWall.ExcludeFromCenterFactor = 0.9;
                                    graphicsWall.NumberOfVertices = 25;
                                }
                                else
                                {
                                    throw("Error! Wall prefab does not contain GraphicsWall component!");
                                }
                            }
                            else
                            {
                                throw("Error! this._wallPrefab == null");
                            }
                        }
                    }     
                }
                
                if(null != representationNodeInstance)
                {
                    mapNode.representationNode = representationNodeInstance;

                    this._parentNode.insertChild(mapNode.representationNode,0);
                    mapNode.representationNode.parent = this._parentNode;
        
                    var leftBottomPoint = this.getLeftBottompWorldPosition();

                    var x = leftBottomPoint.x + ( mapNode.x * this._mapNodeSize ) + ( this._mapNodeSize / 2 );
                    var y = leftBottomPoint.y + ( ( this._height - mapNode.y ) * this._mapNodeSize ) + ( this._mapNodeSize / 2 );
        
                    mapNode.representationNode.setWorldPosition( new Vec3( x, y, 0  ) );
                }
                else
                {
                    throw("Error! representationNodeInstance == null!");
                }
            }
        }

        protected releaseRepresentationNode(mapNode:MapNode)
        {
            if(null != mapNode && null != mapNode.representationNode)
            {
                var nodePool = this.getNodePool(mapNode);

                if(null != nodePool)
                {
                    nodePool.put(mapNode.representationNode);
                    mapNode.representationNode = null;
                }
            }
        }

        private currentVisibleCellsRect = new Rect();

        determineVisibleCells()
        {
            if(null != this._easyReference && null != this._easyReference.camera && null != this._easyReference.canvasUITransform)
            {
                var centerPoint = Maze_Common.toVec2(this._easyReference.camera.screenToWorld(new Vec3(this._easyReference.canvasUITransform.contentSize.x / 2,
                    this._easyReference.canvasUITransform.contentSize.y / 2, 0)));
                var topLeftPoint = Maze_Common.toVec2(this._easyReference.camera.screenToWorld(new Vec3(0, this._easyReference.canvasUITransform.contentSize.y, 0)));
                var bottomRightPoint = Maze_Common.toVec2(this._easyReference.camera.screenToWorld(new Vec3(this._easyReference.canvasUITransform.contentSize.x, 0, 0)));
                
                var topLeftTileCoord = this.pointToTile(topLeftPoint);
                var bottomRightTileCoord = this.pointToTile(bottomRightPoint);

                var additionalRange:number = 3;

                var newVisibleRect = new Rect(topLeftTileCoord.x - additionalRange, topLeftTileCoord.y - additionalRange, bottomRightTileCoord.x - topLeftTileCoord.x + additionalRange*2, bottomRightTileCoord.y - topLeftTileCoord.y + additionalRange*2);
                newVisibleRect = this.normalizeRect(newVisibleRect);

                var shouldRedrawWalls:boolean = false;

                if(false == this.currentVisibleCellsRect.equals(newVisibleRect))
                {
                    var intersectionRect = new Rect();
                    Rect.intersection(intersectionRect, this.currentVisibleCellsRect, newVisibleRect);

                    for(var row = this.currentVisibleCellsRect.y; row < this.currentVisibleCellsRect.yMax; ++row)
                    {
                        for(var column = this.currentVisibleCellsRect.x; column < this.currentVisibleCellsRect.xMax; ++column)
                        {
                            var mapNode = this.MapNodes[row][column];

                            if((row < intersectionRect.y || row >= intersectionRect.yMax) ||
                               (column < intersectionRect.x || column >= intersectionRect.xMax))
                            {
                                if(false == mapNode.isWalkable)
                                {
                                    shouldRedrawWalls = true;
                                }

                                this.releaseRepresentationNode(mapNode);
                            }
                            else
                            {
                                this.assignRepresentationNode(mapNode);
                            }
                        }
                    }

                    for(var row = newVisibleRect.y; row < newVisibleRect.yMax; ++row)
                    {
                        for(var column = newVisibleRect.x; column < newVisibleRect.xMax; ++column)
                        {
                            var mapNode = this.MapNodes[row][column];

                            if((row < intersectionRect.y || row >= intersectionRect.yMax) ||
                               (column < intersectionRect.x || column >= intersectionRect.xMax))
                            {
                                this.assignRepresentationNode(mapNode);
                            }

                            if(false == mapNode.isWalkable && true == shouldRedrawWalls)
                            {
                                if(null != mapNode && null != mapNode.graphicsWall)
                                {
                                    mapNode.graphicsWall.drawn = false;
                                }
                            }
                        }
                    }

                    if(true == shouldRedrawWalls && null != this._sharedGraphics)
                    {
                        this._sharedGraphics.clear();
                    }

                    this.currentVisibleCellsRect = newVisibleRect;
                }
            }
        }

        private _leftBottomWorldPosition:Vec2|null = null;

        public getLeftBottompWorldPosition() : Vec2
        {
            if(null == this._leftBottomWorldPosition)
            {
                var parentWorldPosition:Vec3 = this._parentNode.worldPosition;
                var x = parentWorldPosition.x - ( this._width * this._mapNodeSize / 2 );
                var y = parentWorldPosition.y - ( this._height * this._mapNodeSize / 2 );
                this._leftBottomWorldPosition = new Vec2(x,y);
            }

            return this._leftBottomWorldPosition;
        }

        public resetVisitFlag()
        {
            for(var row:number = 0; row < this._height; ++row)
            {
                for(var column:number = 0; column < this._width; ++column)
                {
                    this.MapNodes[row][column].visited = false;
                }
            }
        }

        findPath(start:MapNode, finish:MapNode) : MapNode[]
        {
            var result:MapNode[] = [];

            if(start.x > 0 && start.x < this._height 
            && start.y > 0 && start.y < this._width
            && finish.x > 0 && finish.x < this._height 
            && finish.y > 0 && finish.y < this._width)
            {
                this.resetVisitFlag();

                const numberCompare = ((a:MapNodePrioritized, b:MapNodePrioritized) => a.priority - b.priority);

                var frontier:Maze_PriorityQueue.PriorityQueue<MapNodePrioritized> = new Maze_PriorityQueue.PriorityQueue<MapNodePrioritized>({comparator: numberCompare, initialValues: []});
                frontier.queue( new MapNodePrioritized(start, 0) );
                start.visited = true;
                var came_from:Map<MapNode,MapNode|null> = new Map<MapNode,MapNode>();
                var cost_so_far:Map<MapNode, number> = new Map<MapNode, number>();

                came_from.set(start, null);
                cost_so_far.set(start, 0);

                while(0 != frontier.length)
                {
                    var current:MapNodePrioritized = frontier.dequeue();

                    if(current.mapNode == finish)
                    {
                        result.push(finish);

                        var backtrace_node = came_from.get(finish);

                        while(backtrace_node != start && null != backtrace_node)
                        {
                            result.push(backtrace_node);
                            backtrace_node = came_from.get(backtrace_node);
                        }

                        result.reverse();

                        break;
                    }

                    var cost_so_far_for_current_node = cost_so_far.get(current.mapNode);
                    if(undefined !== cost_so_far_for_current_node)
                    {
                        var neighbours = current.mapNode.getAllNotVisitedNeighbours();

                        for(var next of neighbours)
                        {   
                            if(true == next[1].isWalkable) // skip the walls
                            {
                                var new_cost:number = cost_so_far_for_current_node + next[1].cost;
                                
                                var cost_so_far_for_next_node = cost_so_far.get(next[1]);

                                if(undefined === cost_so_far_for_next_node)
                                {
                                    cost_so_far.set(next[1], new_cost);
                                    var priority:number = new_cost + this.heuristic(finish.y, finish.x, next[1].y, next[1].x);
                                    frontier.queue( new MapNodePrioritized(next[1], priority) );
                                    came_from.set(next[1], current.mapNode);
                                    next[1].visited = true;
                                }
                                else if(new_cost < cost_so_far_for_next_node)
                                {
                                    cost_so_far.set(next[1], new_cost);
                                    var priority:number = new_cost + this.heuristic(finish.y, finish.x, next[1].y, next[1].x);
                                    frontier.queue( new MapNodePrioritized(next[1], priority) );
                                    came_from.set(next[1], current.mapNode);
                                    next[1].visited = true;
                                }
                            }
                        }
                    }
                    else
                    {
                        throw("Error - undefined === cost_so_far_for_current_node");
                    }

                    
                }
            }
            else
            {
                throw("Error! Wrong input parameters!");
            }

            return result;
        }

        // Manhattan distance on a square grid
        private heuristic(rowA:number, colA:number, rowB:number, colB:number):number
        {
            return Math.abs(colA - colB) + Math.abs(rowA - rowB);
        }

        pointToTile(point:Vec2, out:Vec2|null = null) : Vec2
        {
            var result:Vec2 = null != out ? out : new Vec2();
            
            result.x = point.x;
            result.y = point.y;

            result.subtract(this.getLeftBottompWorldPosition());

            result.x = Math.floor(result.x / this._mapNodeSize);
            result.y = Math.ceil(this._height - ( result.y / this._mapNodeSize ) );

            return result;
        }

        tileToPoint(tile:Vec2, out:Vec2|null = null):Vec2
        {
            var result:Vec2 = null != out ? out : new Vec2();

            try
            {
                var leftBottomPoint = this.getLeftBottompWorldPosition();

                result.x = leftBottomPoint.x + (tile.x * this._mapNodeSize) + (this._mapNodeSize / 2);
                result.y = leftBottomPoint.y + ( (this._height - tile.y) * this._mapNodeSize) + (this._mapNodeSize / 2);
            }
            catch
            {
                throw("Error!");
            }

            return result;
        }

        invertNeighbourType(neighbourType:eNeighbourType):eNeighbourType
        {
            switch(neighbourType)
            {
                case eNeighbourType.BOTTOM: return eNeighbourType.TOP;
                case eNeighbourType.TOP: return eNeighbourType.BOTTOM;
                case eNeighbourType.LEFT: return eNeighbourType.RIGHT;
                case eNeighbourType.RIGHT: return eNeighbourType.LEFT;
            }
        }

        getInvertedNeighbour(mapNode:MapNode|null, neighbourType:eNeighbourType):MapNode|null
        {
            if(null != mapNode)
            {
                switch(neighbourType)
                {
                    case eNeighbourType.BOTTOM:
                        return mapNode.topSibling;
                    case eNeighbourType.TOP:
                        return mapNode.bottomSibling;
                    case eNeighbourType.LEFT:
                        return mapNode.rightSibling;
                    case eNeighbourType.RIGHT:
                        return mapNode.leftSibling;
                }
            }
            else
            {
                return null;
            }
        }

        // returns closest collision with the wall
        raycast(from:Vec2,to:Vec2):[boolean,[number,number]]
        {
            var result:[boolean,[number,number]] = [false, [0,0]];

            // we should take the cell which contains the starting point.
            var startingCell:Vec2|null = this.pointToTile(from);
            var skipEdges:Set<eNeighbourType> = new Set<eNeighbourType>();
            var mapNode:MapNode|null = null;
            var nodePos = new Vec2();
            var intersection:Vec2|null = new Vec2();
            var intersectionResult:[boolean,Vec2];

            var cornerCaseHandlerIsActive:boolean = false;
            var cornerCaseHandlerFirstNode:MapNode|null = null;
            var cornerCaseHandlerSecondNode:MapNode|null = null;
            var cornerCaseHandlerThirdNode:MapNode|null = null;
            var cornerCaseHandlerThirdNodeFirstSkipEdge:eNeighbourType = eNeighbourType.BOTTOM;
            var cornerCaseHandlerThirdNodeSecondSkipEdge:eNeighbourType = eNeighbourType.BOTTOM;

            var switchToNextNode = () =>
            {
                var switchToNextNodeSubFlow = () =>
                {
                    var foundIntersections:Array<[MapNode|null,eNeighbourType]> = [];

                    if(null != mapNode)
                    {
                        var recrXMin = nodePos.x - this._mapNodeSize/2;
                        var rectYMin = nodePos.y - this._mapNodeSize/2;
                        var rectXMax = nodePos.x + this._mapNodeSize/2;
                        var rectYMax = nodePos.y + this._mapNodeSize/2;

                        if(foundIntersections.length < 2 && false == skipEdges.has(eNeighbourType.LEFT))
                        {
                            intersectionResult = Maze_Common.linesCrossOptimized(recrXMin, rectYMin, recrXMin, rectYMax, from.x, from.y, to.x, to.y, intersection);

                            if(true == intersectionResult[0])
                            {
                                foundIntersections.push( [mapNode.leftSibling, eNeighbourType.RIGHT] );
                            }
                        }

                        if(foundIntersections.length < 2 && false == skipEdges.has(eNeighbourType.TOP))
                        {
                            intersectionResult = Maze_Common.linesCrossOptimized(recrXMin, rectYMax, rectXMax, rectYMax, from.x, from.y, to.x, to.y, intersection);

                            if(true == intersectionResult[0])
                            {
                                foundIntersections.push( [mapNode.topSibling, eNeighbourType.BOTTOM] );
                            }
                        }

                        if(foundIntersections.length < 2 && false == skipEdges.has(eNeighbourType.RIGHT))
                        {
                            intersectionResult = Maze_Common.linesCrossOptimized(rectXMax, rectYMax, rectXMax, rectYMin, from.x, from.y, to.x, to.y, intersection);

                            if(true == intersectionResult[0])
                            {
                                foundIntersections.push( [mapNode.rightSibling, eNeighbourType.LEFT] );
                            } 
                        }

                        if(foundIntersections.length < 2 && false == skipEdges.has(eNeighbourType.BOTTOM))
                        {
                            intersectionResult = Maze_Common.linesCrossOptimized(rectXMax, rectYMin, recrXMin, rectYMin, from.x, from.y, to.x, to.y, intersection);

                            if(true == intersectionResult[0])
                            {
                                foundIntersections.push( [mapNode.bottomSibling, eNeighbourType.TOP] );
                            } 
                        }

                        skipEdges.clear();

                        if(1 == foundIntersections.length)
                        {
                            skipEdges.add(foundIntersections[0][1]);
                            mapNode = foundIntersections[0][0];
                        }
                        else if(0 == foundIntersections.length)
                        {
                            mapNode = null;
                        }
                        else if(foundIntersections.length == 2)
                        {
                            skipEdges.add(foundIntersections[0][1]);
                            skipEdges.add(foundIntersections[1][1]);

                            cornerCaseHandlerIsActive = true;
                            cornerCaseHandlerFirstNode = foundIntersections[0][0];
                            cornerCaseHandlerSecondNode = foundIntersections[1][0];
                            cornerCaseHandlerThirdNode = this.getInvertedNeighbour(foundIntersections[0][0], foundIntersections[1][1]);
                            cornerCaseHandlerThirdNodeFirstSkipEdge = this.invertNeighbourType(foundIntersections[0][1]);
                            cornerCaseHandlerThirdNodeSecondSkipEdge = this.invertNeighbourType(foundIntersections[1][1]);

                            mapNode = cornerCaseHandlerFirstNode;
                        }
                    }
                }

                if(true == cornerCaseHandlerIsActive)
                {
                    if(mapNode == cornerCaseHandlerFirstNode)
                    {
                        mapNode = cornerCaseHandlerSecondNode;
                    }
                    else if(mapNode == cornerCaseHandlerSecondNode)
                    {
                        mapNode = cornerCaseHandlerThirdNode;
                        skipEdges.add(cornerCaseHandlerThirdNodeFirstSkipEdge);
                        skipEdges.add(cornerCaseHandlerThirdNodeSecondSkipEdge);
                    }
                    else if(mapNode == cornerCaseHandlerThirdNode)
                    {
                        cornerCaseHandlerIsActive = false;
                        switchToNextNodeSubFlow();
                    }
                }
                else
                {
                    switchToNextNodeSubFlow();
                }                
            }

            mapNode = this.MapNodes[startingCell.y][startingCell.x];
            var fromRelativeToNodePos = new Vec2();
            var toRelativeToNodePos = new Vec2();
            
            if(null != mapNode)
            {
                while(null != mapNode)
                {
                    nodePos = this.tileToPoint(mapNode.tileCoord, nodePos);
                    
                    if(false == mapNode.isWalkable)
                    {
                        var graphicsWall = mapNode.graphicsWall;

                        if(null == graphicsWall)
                        {
                            graphicsWall = this._defaultGraphicsWall;
                        }

                        if(null != graphicsWall)
                        {
                            // let's search, which specific edge we've collision with
                            var collisionFound:boolean = false;

                            fromRelativeToNodePos.x = from.x;
                            fromRelativeToNodePos.y = from.y;
                            fromRelativeToNodePos.subtract(nodePos);
                            toRelativeToNodePos.x = to.x;
                            toRelativeToNodePos.y = to.y;
                            toRelativeToNodePos.subtract(nodePos);

                            var angle1 = Maze_Common.convertSingleAngleToUpVectorTo_0_360( math.toDegree(Maze_Common.upVector.signAngle(fromRelativeToNodePos)) );
                            var angle2 = Maze_Common.convertSingleAngleToUpVectorTo_0_360( math.toDegree(Maze_Common.upVector.signAngle(toRelativeToNodePos)) );
                            var angleDelta = math.toDegree(fromRelativeToNodePos.signAngle(toRelativeToNodePos));

                            var angleFrom = angleDelta > 0 ? angle1 : angle2;
                            var angleTo = angleDelta > 0 ? angle2 : angle1;

                            if(graphicsWall.vertices.length >= 2)
                            {
                                var linesToBeChecked:[number, number][] = [];

                                var checkAngles = () =>
                                {
                                    if(null != graphicsWall)
                                    {
                                        // we should calculate subset of the vertices, which we should check.
                                        if(graphicsWall.angleVertices.length >= 2)
                                        {
                                            if(Math.abs(angleTo - angleFrom) < 0.01) // we have one crossing point
                                            {
                                                var angle = angle1; // we can take any of 2 angles

                                                for(var counter = 0; counter < graphicsWall.angleVertices.length; ++counter)
                                                {
                                                    if(graphicsWall.angleVertices[counter][0] >= angle)
                                                    {
                                                        if(counter == 0)
                                                        {
                                                            linesToBeChecked.push( [ graphicsWall.angleVertices.length - 1, counter] );
                                                        }
                                                        else
                                                        {
                                                            linesToBeChecked.push( [ counter-1, counter ] );
                                                        }

                                                        break;
                                                    }
                                                }
                                            }
                                            else // we have 2 crossing points
                                            {
                                                for(var counter = 0; counter < graphicsWall.angleVertices.length; ++counter)
                                                {
                                                    var angleRangesCollide:boolean = false;

                                                    if(counter == 0)
                                                    {
                                                        angleRangesCollide = Maze_Common.checkAngleRangesCollision(angleFrom, 
                                                            angleTo, 
                                                            graphicsWall.angleVertices[graphicsWall.angleVertices.length - 1][0],
                                                            graphicsWall.angleVertices[counter][0]);
                                                    }
                                                    else
                                                    {
                                                        angleRangesCollide = Maze_Common.checkAngleRangesCollision(angleFrom, 
                                                            angleTo, 
                                                            graphicsWall.angleVertices[counter - 1][0],
                                                            graphicsWall.angleVertices[counter][0]);
                                                    }

                                                    if(true == angleRangesCollide)
                                                    {
                                                        if(counter == 0)
                                                        {
                                                            linesToBeChecked.push( [ graphicsWall.angleVertices.length - 1, counter ] );
                                                        }
                                                        else
                                                        {
                                                            linesToBeChecked.push( [ counter - 1, counter ] );
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                checkAngles();

                                var currentLength = 0;
                                var candidateLength = 0;

                                for(var line of linesToBeChecked)
                                {
                                    var lineCrossCheck = () =>
                                    {
                                        if(null != graphicsWall)
                                        {
                                            intersectionResult = Maze_Common.linesCrossOptimized(
                                                nodePos.x + graphicsWall.angleVertices[line[0]][1].x, 
                                                nodePos.y + graphicsWall.angleVertices[line[0]][1].y, 
                                                nodePos.x + graphicsWall.angleVertices[line[1]][1].x, 
                                                nodePos.y + graphicsWall.angleVertices[line[1]][1].y, 
                                                from.x, from.y, to.x, to.y, intersection);
                                        }
                                    }
                                    
                                    lineCrossCheck();

                                    var assignResult = () =>
                                    {
                                        if(true == intersectionResult[0])
                                        {
                                            collisionFound = true;
                                            
                                            if(result[0] == false)
                                            {
                                                result[1][0] = intersectionResult[1].x;
                                                result[1][1] = intersectionResult[1].y;
                                                result[0] = true;

                                                currentLength = Maze_Common.vectorLength( result[1][0] - from.x, result[1][1] - from.y );
                                            }
                                            else
                                            {
                                                // compare lengths
                                                candidateLength = Maze_Common.vectorLength( intersectionResult[1].x - from.x, intersectionResult[1].y - from.y );
                                                if( candidateLength < currentLength )
                                                {
                                                    currentLength = candidateLength;
                                                    result[1][0] = intersectionResult[1].x;
                                                    result[1][1] = intersectionResult[1].y;
                                                }
                                            }
                                        }
                                    } 

                                    assignResult();
                                }
                            }

                            if(false == collisionFound)
                            {
                                switchToNextNode();
                            }
                            else
                            {
                                break;
                            }
                        }
                        else
                        {
                            throw("Error! graphicsWall == null");
                        }
                    }
                    else
                    {
                        switchToNextNode();
                    }
                }
            }
            else
            {
                throw("Error! mapNode == null!");
            }

            return result;
        }

        formVisiblePolygon(point:Vec2, radius:number, debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null):[number, number][]
        {
            if(null != debugGraphics)
            {
                debugGraphics.clear();
            }
            
            var result:[number, number][] = [];

            var nodePos = new Vec2();

            var sortVertices = (collection:[number,number][])=>
            {
                // we need to sort vertices by angle
                collection.sort((a:[number,number], b:[number,number]) => 
                {
                    return Maze_Common.pseudoangle(a[0] - point.x, a[1] - point.y) - Maze_Common.pseudoangle(b[0] - point.x, b[1] - point.y);
                });
            };

            // are we inside the maze?
            var tileCoord = this.pointToTile(point);
            if(tileCoord.x > 0 && tileCoord.y > 0 && tileCoord.x < this._width && tileCoord.y < this._height)
            {
                // yes, we are inside the maze.
                // Are we inside the wall?
                if(true == this.MapNodes[tileCoord.y][tileCoord.x].isWalkable)
                {
                    // no, we are not inside the wall

                    var impactingWallVertices:Array<[number,number]> = new Array<[number,number]>();

                    // Which walls are within the radius of this light source?
                    // Let's build a square around the circle
                    var rect:Rect = new Rect();
                    rect.x = point.x - radius;
                    rect.y = point.y - radius;
                    rect.width = point.x + radius - rect.x;
                    rect.height = point.y + radius - rect.y;

                    var from = this.pointToTile( new Vec2(rect.x, rect.y) );
                    var to = this.pointToTile( new Vec2(rect.xMax, rect.yMax) );

                    var tileRect = new Rect();
                    tileRect.x = from.x;
                    tileRect.y = to.y;
                    tileRect.width = to.x - from.x;
                    tileRect.height = from.y - to.y;

                    tileRect = this.normalizeRect(tileRect);

                    var yMax = tileRect.yMax == this.MapNodes.length ? tileRect.yMax - 1 : tileRect.yMax;
                    var xMax = tileRect.xMax == this.MapNodes.length ? tileRect.xMax - 1 : tileRect.xMax;

                    var vertexWorldCoordinate = new Vec2();
                    var clockwizeAdditionalVec = new Vec2();
                    var counterClockwizeAdditionalVec = new Vec2();
                    var visibilityCheckTmpVec1 = new Vec2();
                    var visibilityCheckTmpVec2 = new Vec2();
                    var visibilityCheckTmpVec3 = new Vec2();
                    var intersectionTmpVec = new Vec2();

                    for(var row = tileRect.y; row <= yMax; ++row)
                    {
                        for(var column = tileRect.x; column <= xMax; ++column)
                        {
                            var mapNode = this.MapNodes[row][column];

                            nodePos = this.tileToPoint(mapNode.tileCoord, nodePos);
                            
                            if(false == mapNode.isWalkable)
                            {
                                var graphicsWall:Maze_GraphicsWall.GraphicsWall|null = mapNode.graphicsWall;

                                if(null == graphicsWall)
                                {
                                    graphicsWall = this._defaultGraphicsWall;
                                }
                        
                                if(null != graphicsWall)
                                {
                                    var counter = 0;

                                    for(var vertex of graphicsWall.vertices)
                                    {
                                        vertexWorldCoordinate.x = vertex.x;
                                        vertexWorldCoordinate.y = vertex.y;
                                        vertexWorldCoordinate.add(nodePos);

                                        if(true == Maze_Common.isPointInsideCircle(vertexWorldCoordinate, point, radius))
                                        {
                                            // Here we should put in the impactingWallVertices collection only the vertices, for which 
                                            // both edges, which are containing them are "looking at the origin point"

                                            var line1:[number,number,number,number] = [0,0,0,0];
                                            var line2:[number,number,number,number] = [0,0,0,0];

                                            if(counter == 0)
                                            {
                                                line1[0] = nodePos.x + graphicsWall.vertices[graphicsWall.vertices.length - 1].x;
                                                line1[1] = nodePos.y + graphicsWall.vertices[graphicsWall.vertices.length - 1].y;
                                                line1[2] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line1[3] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[0] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line2[1] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[2] = nodePos.x + graphicsWall.vertices[counter + 1].x;
                                                line2[3] = nodePos.y + graphicsWall.vertices[counter + 1].y;
                                            }
                                            else if(counter == graphicsWall.vertices.length - 1)
                                            {
                                                line1[0] = nodePos.x + graphicsWall.vertices[counter - 1].x;
                                                line1[1] = nodePos.y + graphicsWall.vertices[counter - 1].y;
                                                line1[2] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line1[3] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[0] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line2[1] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[2] = nodePos.x + graphicsWall.vertices[0].x;
                                                line2[3] = nodePos.y + graphicsWall.vertices[0].y;
                                            }
                                            else
                                            {
                                                line1[0] = nodePos.x + graphicsWall.vertices[counter - 1].x;
                                                line1[1] = nodePos.y + graphicsWall.vertices[counter - 1].y;
                                                line1[2] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line1[3] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[0] = nodePos.x + graphicsWall.vertices[counter].x;
                                                line2[1] = nodePos.y + graphicsWall.vertices[counter].y;
                                                line2[2] = nodePos.x + graphicsWall.vertices[counter + 1].x;
                                                line2[3] = nodePos.y + graphicsWall.vertices[counter + 1].y;
                                            }

                                            // here we should check whether the side lines intersect with lines which are formed by "previousm, this", "this, next" lines
                                            visibilityCheckTmpVec1.x = line1[0];
                                            visibilityCheckTmpVec1.y = line1[1];
                                            visibilityCheckTmpVec2.x = line1[0];
                                            visibilityCheckTmpVec2.y = line1[1];
                                            visibilityCheckTmpVec3.x = line1[2];
                                            visibilityCheckTmpVec3.y = line1[3];
                                            var angle1 = math.toDegree(visibilityCheckTmpVec1.subtract(point).signAngle(visibilityCheckTmpVec3.subtract(visibilityCheckTmpVec2)));
                                            visibilityCheckTmpVec1.x = line2[0];
                                            visibilityCheckTmpVec1.y = line2[1];
                                            visibilityCheckTmpVec2.x = line2[0];
                                            visibilityCheckTmpVec2.y = line2[1];
                                            visibilityCheckTmpVec3.x = line2[2];
                                            visibilityCheckTmpVec3.y = line2[3];
                                            var angle2 = math.toDegree(visibilityCheckTmpVec1.subtract(point).signAngle(visibilityCheckTmpVec3.subtract(visibilityCheckTmpVec2)));
                                            if(angle1 < 0 && angle1 >= -180 ||
                                                angle2 < 0 && angle2 >= -180)
                                            {
                                                impactingWallVertices.push([vertexWorldCoordinate.x,vertexWorldCoordinate.y]);

                                                clockwizeAdditionalVec.x = vertexWorldCoordinate.x;
                                                clockwizeAdditionalVec.y = vertexWorldCoordinate.y;
                                                clockwizeAdditionalVec.subtract(point).rotate(-0.001).normalize().multiplyScalar(radius).add(point);

                                                if(false == Maze_Common.linesCrossOptimized(line1[0], line1[1], line1[2], line1[3], point.x, point.y, clockwizeAdditionalVec.x, clockwizeAdditionalVec.y, intersectionTmpVec)[0] &&
                                                false == Maze_Common.linesCrossOptimized(line2[0], line2[1], line2[2], line2[3], point.x, point.y, clockwizeAdditionalVec.x, clockwizeAdditionalVec.y, intersectionTmpVec)[0])
                                                {
                                                    impactingWallVertices.push([clockwizeAdditionalVec.x,clockwizeAdditionalVec.y]);
                                                }
                                                
                                                counterClockwizeAdditionalVec.x = vertexWorldCoordinate.x;
                                                counterClockwizeAdditionalVec.y = vertexWorldCoordinate.y;
                                                counterClockwizeAdditionalVec.subtract(point).rotate(0.001).normalize().multiplyScalar(radius).add(point);

                                                if(false == Maze_Common.linesCrossOptimized(line1[0], line1[1], line1[2], line1[3], point.x, point.y, counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y, intersectionTmpVec)[0] &&
                                                false == Maze_Common.linesCrossOptimized(line2[0], line2[1], line2[2], line2[3], point.x, point.y, counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y, intersectionTmpVec)[0])
                                                {
                                                    impactingWallVertices.push([counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y]);
                                                }
                                            }
                                        }

                                        ++counter;
                                    }
                                }
                                else
                                {
                                    throw("Error! Non-walkable cell is not of type GraphicsWall!");
                                }
                            }
                            else
                            {
                                // let's add additional lines to the intersections of the walkable cells with the radius
                                var recrXMin = nodePos.x - this._mapNodeSize/2;
                                var rectYMin = nodePos.y - this._mapNodeSize/2;
                                var rectXMax = nodePos.x + this._mapNodeSize/2;
                                var rectYMax = nodePos.y + this._mapNodeSize/2;

                                var edges:[number,number,number,number][] = [];

                                edges.push([recrXMin, rectYMin, recrXMin, rectYMax]);
                                edges.push([recrXMin, rectYMax, rectXMax, rectYMax]);
                                edges.push([rectXMax, rectYMax, rectXMax, rectYMin]);
                                edges.push([rectXMax, rectYMin, recrXMin, rectYMin]);

                                for(var edge of edges)
                                {
                                    var intersection = Maze_Common.closestLineCircleIntersection(point, radius, edge[0], edge[1], edge[2], edge[3]);

                                    if(null != intersection)
                                    {
                                        impactingWallVertices.push([intersection.x, intersection.y]);

                                        if(null != debugGraphics)
                                        {
                                            debugGraphics.circle(intersection.x, intersection.y,50);
                                            debugGraphics.fillColor = new Color(0,250,0);
                                            debugGraphics.fill();
                                            debugGraphics.stroke();
                                        }
                                    }
                                }
                            }
                        }
                    }

                    var addCircleRays = () =>
                    {
                        // Add circle rays
                        for(var i = 0; i < this._circleRays.length; ++i)
                        {
                            var circleVector = this._circleRays[i].clone().multiplyScalar(radius).add(point);
                            impactingWallVertices.push([circleVector.x,circleVector.y]);
                        }
                    };

                    addCircleRays();

                    // now we have a sub-set of vertices, which could impact the light source
                    // We should raycast to each of them.

                    var collisionResultTmpInputVec = new Vec2();
                    for(var impactingVertex of impactingWallVertices)
                    {
                        if(null != debugGraphics)
                        {
                            debugGraphics.moveTo(point.x,point.y);
                            debugGraphics.lineTo(impactingVertex[0], impactingVertex[1]);
                            debugGraphics.close();
                            debugGraphics.stroke();
                        }

                        collisionResultTmpInputVec.x = impactingVertex[0];
                        collisionResultTmpInputVec.y = impactingVertex[1];
                        var collisionResult = this.raycast(point, collisionResultTmpInputVec);

                        if(true == collisionResult[0])
                        {
                            result.push( [collisionResult[1][0], collisionResult[1][1]] );
                        }
                        else
                        {
                            result.push( [collisionResultTmpInputVec.x, collisionResultTmpInputVec.y] );
                        }
                    }
                }
                else
                {
                    // yes, we are inside the wall
                    var mapNode = this.MapNodes[tileCoord.y][tileCoord.x];

                    // is it a graphics wall?
                    var graphicsWall:Maze_GraphicsWall.GraphicsWall|null = mapNode.graphicsWall;

                    if(null == graphicsWall)
                    {
                        graphicsWall = this._defaultGraphicsWall;
                    }

                    if(null != graphicsWall)
                    {
                        // Yes, it is.
                        var graphicsWallWorldPosition = Maze_Common.toVec2( graphicsWall.node.worldPosition );
                        var vertices = graphicsWall.vertices;

                        // Then, let's fetch all the vertices of the wall as a result.
                        for(var vertex of vertices)
                        {
                            var shiftedVertex = vertex.clone().add(graphicsWallWorldPosition);
                            result.push( [shiftedVertex.x,shiftedVertex.y] );
                        }
                    }
                    else
                    {
                        throw("Error! Wall's representation node is null!");
                    }
                }
            }

            // sort the result by angle
            sortVertices(result);

            return result;
        }

        normalizeRect(rect:Rect):Rect
        {
            var result:Rect = new Rect();

            if(rect.x < 0)
            {
                result.x = 0;
            }
            else if(rect.x >= this._width)
            {
                result.x = this._width - 1;
            }
            else
            {
                result.x = rect.x;
            }

            if(rect.y < 0)
            {
                result.y = 0;
            }
            else if(rect.y >= this._height)
            {
                result.y = this._height - 1;
            }
            else
            {
                result.y = rect.y;
            }

            if(rect.width < 0)
            {
                result.width = 0;
            }
            else if(result.x + rect.width > this._width)
            {
                result.width = this._width - result.x;
            }
            else
            {
                result.width = rect.width;
            }

            if(rect.height < 0)
            {
                result.height = 0;
            }
            else if(result.y + rect.height > this._height)
            {
                result.height = this._height - result.y;
            }
            else
            {
                result.height = rect.height;
            }

            return result;
        }

        filterTiles( innerRange:math.Rect, outterRange:math.Rect, walkable:boolean = true) : Vec2[]
        {
            var result:Vec2[] = []

            if(0 != this.MapNodes.length)
            {
                var innerRangeNormalized:Rect = this.normalizeRect(innerRange);
                var outerRangeNormalized:Rect = this.normalizeRect(outterRange);

                for(var row:number = outerRangeNormalized.y; row < outerRangeNormalized.yMax; ++row)
                {
                    for(var column:number = outerRangeNormalized.x; column < outerRangeNormalized.xMax; ++column)
                    {
                        try
                        {
                            if( ( column < innerRangeNormalized.x || column > innerRangeNormalized.xMax - 1 
                                || row < innerRangeNormalized.y || row > innerRangeNormalized.yMax - 1 )
                                && walkable == this.MapNodes[row][column].isWalkable )
                            {
                                result.push(new Vec2(column, row));
                            }
                        }
                        catch
                        {
                            throw("Error!");
                        }

                    }
                }
            }

            return result;
        }

        filterTiles2( range:math.Rect, walkable:boolean = true ) : Vec2[]
        {
            var result:Vec2[] = []

            var rangeNormalized:Rect = this.normalizeRect(range);

            for(var row:number = rangeNormalized.y; row < rangeNormalized.yMax; ++row)
            {
                for(var column:number = rangeNormalized.x; column < rangeNormalized.xMax; ++column)
                {
                    try
                    {
                        if( walkable == this.MapNodes[row][column].isWalkable )
                        {
                            result.push(new Vec2(column, row));
                        }
                    }
                    catch
                    {
                        throw("Error!");
                    }

                }
            }

            return result;
        }

        getReachableCells( targetPoint:Vec2, minCellDistance:number, maxCellDistance:number ):MapNode[]
        {            
            if(targetPoint.x > 0 && targetPoint.x < this._height 
            && targetPoint.y > 0 && targetPoint.y < this._width)
            {
                var start = this.MapNodes[targetPoint.y][targetPoint.x]

                this.resetVisitFlag();
                
                var result:MapNode[] = [];

                var frontierCurrent:std.Deque<MapNode> = new std.Deque<MapNode>();
                var frontierNext:std.Deque<MapNode> = new std.Deque<MapNode>();

                frontierCurrent.push( start );

                var came_from:Set<MapNode> = new Set<MapNode>();

                if(0 == minCellDistance)
                {
                    came_from.add(start);
                }

                start.visited = true;

                for(var i:number = 0; i < maxCellDistance; ++i)
                {
                    if(false == frontierCurrent.empty())
                    {
                        while(false == frontierCurrent.empty())
                        {
                            var current:MapNode = frontierCurrent.back();
                            frontierCurrent.pop_back();

                            var neighbors = current.getAllNotVisitedNeighbours();

                            for(var next of neighbors)
                            {
                                if(true == next[1].isWalkable) // skip the walls
                                {
                                    if(false == came_from.has(next[1]))
                                    {
                                        frontierNext.push(next[1]);
                                        if(i+1 >= minCellDistance)
                                        {
                                            came_from.add(next[1]);
                                        }
                                    }
                                }
                            }

                            current.visited = true;
                        }

                        frontierCurrent.swap(frontierNext);
                    }
                    else
                    {
                        break;
                    }
                }
            }
            else
            {
                throw("Error! Wrong input parameters!");
            }

            for(var cameFromItem of came_from)
            {
                result.push(cameFromItem);
            }

            return result;
        }
    }

    @ccclass('MapBuilder')
    export class MapBuilder extends Component
    {
        static instance:MapBuilder;

        @property (Graphics)
        _sharedGraphics:Graphics|null = null;

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
        _width:number = 10;

        @property
        set Width(val:number)
        {
            this._width = val;
        }
        get Width():number
        {
            return this._width;
        }

        @property
        _height:number = 10;

        @property
        set Height(val:number)
        {
            this._height = val;
        }
        get Height():number
        {
            return this._height;
        }

        @property
        _mapNodeSize:number = 100;

        @property
        set MapNodeSize(val:number)
        {
            this._mapNodeSize = val;
        }
        get MapNodeSize():number
        {
            return this._mapNodeSize;
        }

        @property (Prefab)
        _floorPrefab:Prefab|null = null;

        @property (Prefab)
        set FloorPrefab(val:Prefab|null)
        {
            this._floorPrefab = val;
        }
        get FloorPrefab():Prefab|null
        {
            return this._floorPrefab;
        }

        @property (Prefab)
        _wallPrefab:Prefab|null = null;
        
        @property (Prefab)
        set WallPrefab(val:Prefab|null)
        {
            this._wallPrefab = val;
        }
        get WallPrefab():Prefab|null
        {
            return this._wallPrefab;
        }

        @property
        Debug:boolean = false;

        public getLeftBottompWorldPosition() : Vec2
        {
            if(null != this._map)
            {
                return this._map.getLeftBottompWorldPosition();
            }

            return new Vec2();
        }

        private _map:LevelMap|null = null;

        createMap()
        {
            this.node.setWorldPosition(new Vec3(0,0,0));

            if(null != this._floorPrefab && null != this._wallPrefab && null != this._sharedGraphics)
            {
                this.node.removeAllChildren();
                this._map = new LevelMap( this.node, this._sharedGraphics, this._width, this._height, this._mapNodeSize, this._floorPrefab, this._wallPrefab, this.Debug );
            }
        }

        constructor()
        {
            super();
            MapBuilder.instance = this;
        }

        onLoad()
        {
            this.createMap();
        }

        filterTiles( innerRange:math.Rect, outterRange:math.Rect, walkable:boolean = true) : Vec2[]
        {
            if(null != this._map)
            {
                return this._map.filterTiles(innerRange, outterRange, walkable);
            }

            throw("Error! this._map == null!");
        }

        filterTiles2( range:math.Rect, walkable:boolean = true ) : Vec2[]
        {
            if(null != this._map)
            {
                return this._map.filterTiles2(range, walkable);
            }

            throw("Error! this._map == null!");
        }

        findPath(start:Vec2, finish:Vec2) : Vec2[]
        {
            var result:Vec2[] = [];

            try
            {
                if(null != this._map)
                {

                    var path = this._map.findPath(this._map.MapNodes[start.y][start.x], this._map.MapNodes[finish.y][finish.x]);

                    for(var node of path)
                    {
                        if(null != node)
                        {
                            result.push( this.tileToPoint(node.tileCoord) );
                        }
                    }
                }
                else
                {
                    throw("Error! this._map == null!");
                }
            }
            catch
            {
                console.log("Error!");
            }

            return result;
        }

        getReachableCells( targetPoint:Vec2, minCellDistance:number, maxCellDistance:number ):Vec2[]
        {
            if(null != this._map)
            {
                var result:Vec2[] = [];

                var rechableCells = this._map.getReachableCells(targetPoint, minCellDistance, maxCellDistance);

                for(var mapNode of rechableCells)
                {
                    if(null != mapNode)
                    {
                        result.push( new Vec2( mapNode.x, mapNode.y ) );
                    }
                }

                return result;
            }

            throw("Error! this._map == null!");
        }

        raycast(from:Vec2,to:Vec2):[boolean,[number,number]]
        {
            var result:[boolean,[number,number]] = [false, [0,0]];

            if(null != this._map)
            {
                result = this._map.raycast(from, to);
            }

            return result;
        }

        pointToTile(point:Vec2, out:Vec2|null = null) : Vec2
        {
            if(null != this._map)
            {
                return this._map.pointToTile(point, out);
            }

            throw("Error! this._map == null!");
        }

        tileToPoint(tile:Vec2, out:Vec2|null = null)
        {
            if(null != this._map)
            {
                return this._map.tileToPoint(tile, out);
            }

            throw("Error! this._map == null!");
        }

        formVisiblePolygon(point:Vec2, radius:number, debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null):[number,number][]
        {
            if(null != this._map)
            {
                return this._map.formVisiblePolygon(point, radius, debugGraphics);
            }

            throw("Error! this._map == null!");
        }

        normalizeRect(rect:Rect):Rect
        {
            if(null != this._map)
            {
                return this._map.normalizeRect(rect);
            }

            throw("Error! this._map == null!");
        }

        update()
        {
            if(this._map != null)
            {
                this._map.determineVisibleCells();
            }
        }
    }
}