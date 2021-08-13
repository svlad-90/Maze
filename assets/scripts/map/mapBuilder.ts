import { _decorator, Component, Node, Prefab, Vec2, instantiate, Vec3, UITransform, Graphics, ResolutionPolicy, math, randomRangeInt, Label, Rect, PhysicsSystem2D, ERaycast2DType, Line } from 'cc';
import { Maze_GraphicsWall } from '../wall/graphicsWall';
import { Maze_MazeGenerator } from '../maze/mazeGenerator';
import { Maze_PriorityQueue } from '../common/priorityQueue/priorityQueue.ts';
import { Maze_Common } from '../common';
import { Maze_DebugGraphics } from '../common/debugGraphics';
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

        constructor(x:number, y:number)
        {
            this._x = x;
            this._y = y;
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
                                            this.MapNodes[row*2][column*2].isWalkable       = !(maze[row][column].leftWall || maze[row][column].topWall);

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

            // generate maze
            this.generateMaze();

            var leftBottomPoint = this.getLeftBottompWorldPosition();

            // create representation nodes
            for(var row:number = 0; row < height; ++row)
            {
                for(var column:number = 0; column < width; ++column)
                {
                    var mapNode = this.MapNodes[row][column];

                    if(true == mapNode.isWalkable)
                    {
                        mapNode.representationNode = instantiate(this._floorPrefab);
                        
                        var uiTransform = mapNode.representationNode.getComponent(UITransform);
                        
                        if(uiTransform != null)
                        {
                            uiTransform.setContentSize( this._mapNodeSize, this._mapNodeSize );
                        }
                    }
                    else
                    {
                        mapNode.representationNode = instantiate(this._wallPrefab);
                        
                        var graphicsWall = mapNode.representationNode.getComponent(Maze_GraphicsWall.GraphicsWall);
                        
                        if(graphicsWall != null)
                        {
                            graphicsWall.Dimensions = new Vec2(this._mapNodeSize, this._mapNodeSize);
                            graphicsWall.SharedGraphics = this._sharedGraphics;
                            graphicsWall.ExcludeFromCenterFactor = 0.9;
                            graphicsWall.NumberOfVertices = 25;
                        }
                    }
        
                    this._parentNode.addChild(mapNode.representationNode);
                    mapNode.representationNode.parent = this._parentNode;
        
                    var x = leftBottomPoint.x + ( column * this._mapNodeSize ) + ( this._mapNodeSize / 2 );
                    var y = leftBottomPoint.y + ( ( this._height - row ) * this._mapNodeSize ) + ( this._mapNodeSize / 2 );
        
                    mapNode.representationNode.setWorldPosition( new Vec3( x, y, 0  ) );

                    if(true == debug)
                    {
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

            return result;
        }

        // Manhattan distance on a square grid
        private heuristic(rowA:number, colA:number, rowB:number, colB:number):number
        {
            return Math.abs(colA - colB) + Math.abs(rowA - rowB);
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

        private _circleRays:Vec2[] = [];

        public pointToTile(point:Vec2) : Vec2
        {
            var result = point.clone().subtract(this.getLeftBottompWorldPosition());

            result.x = Math.floor(result.x / this._mapNodeSize);
            result.y = Math.ceil(this.Height - ( result.y / this._mapNodeSize ) );

            return result;
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

        start()
        {
            // add circle radius rays
            var upVector:Vec2 = new Vec2(0,-1);
            var iMax = 360;
            for(var i = 0; i < iMax; ++i)
            {
                var circleVector = upVector.clone().rotate(math.toRadian(i * (360 / iMax)));
                this._circleRays.push(circleVector);
            }
        }
        
        private normalizeRect(rect:Rect):Rect
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
            else if(rect.x + rect.width > this._width)
            {
                result.width = this._width - rect.x;
            }
            else
            {
                result.width = rect.width;
            }

            if(rect.height < 0)
            {
                result.height = 0;
            }
            else if(rect.y + rect.height > this._height)
            {
                result.height = this._height - rect.y;
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

            if(null != this._map)
            {
                if(0 != this._map.MapNodes.length)
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
                                    && walkable == this._map.MapNodes[row][column].isWalkable )
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
            }

            return result;
        }

        filterTiles2( range:math.Rect, walkable:boolean = true ) : Vec2[]
        {
            var result:Vec2[] = []

            if(null != this._map)
            {
                var rangeNormalized:Rect = this.normalizeRect(range);

                for(var row:number = rangeNormalized.y; row < rangeNormalized.yMax; ++row)
                {
                    for(var column:number = rangeNormalized.x; column < rangeNormalized.xMax; ++column)
                    {
                        try
                        {
                            if( walkable == this._map.MapNodes[row][column].isWalkable )
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

        tileToPoint(tile:Vec2)
        {
            var result:Vec2 = new Vec2();

            try
            {
                var leftBottomPoint = this.getLeftBottompWorldPosition();

                result.x = leftBottomPoint.x + (tile.x * this._mapNodeSize) + (this._mapNodeSize / 2);
                result.y = leftBottomPoint.y + ( (this.Height - tile.y) * this._mapNodeSize) + (this._mapNodeSize / 2);
            }
            catch
            {
                throw("Error!");
            }

            return result;
        }

        findPath(start:Vec2, finish:Vec2) : Vec2[]
        {
            var result:Vec2[] = [];

            if(null != this._map)
            {
                if(start.x > 0 && start.x < this._height 
                && start.y > 0 && start.y < this._width
                && finish.x > 0 && finish.x < this._height 
                && finish.y > 0 && finish.y < this._width)
                {
                    var path = this._map.findPath(this._map.MapNodes[start.y][start.x], this._map.MapNodes[finish.y][finish.x]);

                    for(var node of path)
                    {
                        if(null != node)
                        {
                            if(null != node.representationNode)
                            {
                                result.push( Maze_Common.toVec2( node.representationNode.worldPosition ) );
                            }
                            else
                            {
                                throw("Error! null == nodeInstance.representationNode!");
                            }
                        }
                    }
                }
                else
                {
                    throw("Error! Wrong input parameters!");
                }
            }

            return result;
        }

        formVisiblePolygon(point:Vec2, radius:number, debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null):Vec2[]
        {
            if(null != debugGraphics)
            {
                debugGraphics.clear();
            }
            
            var result:Vec2[] = [];

            // are we inside the maze?
            var tileCoord = this.pointToTile(point);
            if(tileCoord.x > 0 && tileCoord.y > 0 && tileCoord.x < this.Width && tileCoord.y < this.Height)
            {
                // yes, we are inside the maze.
                if(null != this._map)
                {
                    // Are we inside the wall?
                    if(true == this._map.MapNodes[tileCoord.y][tileCoord.x].isWalkable)
                    {
                        // no, we are not inside the wall
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

                        var yMax = tileRect.yMax == this._map.MapNodes.length ? tileRect.yMax - 1 : tileRect.yMax;
                        var xMax = tileRect.xMax == this._map.MapNodes.length ? tileRect.xMax - 1 : tileRect.xMax;

                        var impactingWallVertices:Array<Vec2> = new Array<Vec2>();

                        var upVector:Vec2 = new Vec2(0,-1); 

                        var sortVertices = ()=>
                        {
                            // we need to sort vertices by angle
                            impactingWallVertices.sort((a, b) => 
                            {
                                return upVector.signAngle(a.clone().subtract(point)) - upVector.signAngle(b.clone().subtract(point));
                            });
                        };

                        for(var row = tileRect.y; row <= yMax; ++row)
                        {
                            for(var column = tileRect.x; column <= xMax; ++column)
                            {
                                var mapNode = this._map.MapNodes[row][column];

                                if(false == mapNode.isWalkable)
                                {
                                    if(null != mapNode.representationNode)
                                    {
                                        var graphicsWall = mapNode.graphicsWall;
                                
                                        if(null != graphicsWall)
                                        {
                                            var graphicsWallWorldPosition = this.tileToPoint(new Vec2(mapNode.x, mapNode.y));

                                            for(var vertex of graphicsWall.vertices)
                                            {
                                                var vertexWorldCoordinate = vertex.clone().add(graphicsWallWorldPosition);

                                                if(true == Maze_Common.isPointInsideCircle(vertexWorldCoordinate, point, radius))
                                                {
                                                    impactingWallVertices.push(vertexWorldCoordinate);
                                                }
                                            }
                                        }
                                        else
                                        {
                                            throw("Error! Non-walkable cell is not of type GraphicsWall!");
                                        }
                                    }
                                    else
                                    {
                                        throw("Error! Wall's representation node is null!");
                                    }
                                }
                            }
                        }

                        // Add circle rays
                        for(var i = 0; i < this._circleRays.length; ++i)
                        {
                            var circleVector = this._circleRays[i].clone().multiplyScalar(radius).add(point);
                            impactingWallVertices.push(circleVector);
                        }

                        // sort the vertices, which we are working with
                        sortVertices();

                        // now we have a sub-set of vertices, which could impact the light source
                        // We should raycast to each of them.
                        for(var impactingVertex of impactingWallVertices)
                        {
                            if(null != debugGraphics)
                            {
                                debugGraphics.moveTo(point.x,point.y);
                                debugGraphics.lineTo(impactingVertex.x, impactingVertex.y);
                                debugGraphics.close();
                                debugGraphics.stroke();
                            }

                            var collisionPoint = this.raycast(point,impactingVertex);

                            if(null != collisionPoint)
                            {
                                result.push(collisionPoint);
                            }
                            else
                            {
                                result.push(impactingVertex);
                            }
                        }
                    }
                    else
                    {
                        // yes, we are inside the wall
                        var mapNode = this._map.MapNodes[tileCoord.y][tileCoord.x];

                        // do we have a representation node?
                        if(null != mapNode.representationNode)
                        {
                            // Yes, we have it
                            var graphicsWall = mapNode.representationNode.getComponent(Maze_GraphicsWall.GraphicsWall);
                            
                            // is it a graphics wall?
                            if(null != graphicsWall)
                            {
                                // Yes it is. 
                                var graphicsWallWorldPosition = Maze_Common.toVec2( graphicsWall.node.worldPosition );
                                var vertices = graphicsWall.vertices;

                                // Then, let's fetch all the vertices of the wall as a result.
                                for(var vertex of vertices)
                                {
                                    result.push( vertex.add(graphicsWallWorldPosition) );
                                }
                            }
                            else
                            {
                                throw("Error! Non-walkable cell is not of type GraphicsWall!");
                            }
                        }
                        else
                        {
                            throw("Error! Wall's representation node is null!");
                        }
                    }
                }
            }

            return result;
        }

        // returns closest collision with the wall
        raycast(from:Vec2,to:Vec2):Vec2|null
        {
            var result:Vec2|null = null;

            // we should take the cell which contains the starting point.
            var startingCell:Vec2|null = this.pointToTile(from);
            var skipEdge:eNeighbourType|null = null;
            var mapNode:MapNode|null = null;

            var switchToNextNode = () =>
            {
                if(null != mapNode)
                {
                    if(null != mapNode.representationNode)
                    {
                        var nodePos = this.tileToPoint(new Vec2(mapNode.x, mapNode.y));
                        var bb:Rect = new Rect(nodePos.x - this.MapNodeSize/2, nodePos.y - this.MapNodeSize/2, this.MapNodeSize, this.MapNodeSize);

                        // let's switch to the next node
                        if(skipEdge == null || skipEdge != eNeighbourType.LEFT)
                        {
                            var intersection = Maze_Common.linesCrossOptimized(bb.x, bb.y, bb.x, bb.yMax, from.x, from.y, to.x, to.y);

                            if(null != intersection)
                            {
                                skipEdge = eNeighbourType.RIGHT;
                                mapNode = mapNode.leftSibling;
                                return;
                            }
                        }

                        if(skipEdge == null || skipEdge != eNeighbourType.TOP)
                        {
                            var intersection = Maze_Common.linesCrossOptimized(bb.x, bb.yMax, bb.xMax, bb.yMax, from.x, from.y, to.x, to.y);

                            if(null != intersection)
                            {
                                skipEdge = eNeighbourType.BOTTOM;
                                mapNode = mapNode.topSibling;
                                return;
                            }
                        }

                        if(skipEdge == null || skipEdge != eNeighbourType.RIGHT)
                        {
                            var intersection = Maze_Common.linesCrossOptimized(bb.xMax, bb.yMax, bb.xMax, bb.y, from.x, from.y, to.x, to.y);

                            if(null != intersection)
                            {
                                skipEdge = eNeighbourType.LEFT;
                                mapNode = mapNode.rightSibling;
                                return;
                            } 
                        }

                        if(skipEdge == null || skipEdge != eNeighbourType.BOTTOM)
                        {
                            var intersection = Maze_Common.linesCrossOptimized(bb.xMax, bb.y, bb.x, bb.y, from.x, from.y, to.x, to.y);

                            if(null != intersection)
                            {
                                skipEdge = eNeighbourType.TOP;
                                mapNode = mapNode.bottomSibling;
                                return;
                            } 
                        }

                        skipEdge = null;
                        mapNode = null;
                    }
                    else
                    {
                        throw("Error! mapNode.representationNode == null!");
                    }
                }
            }

            if(null != this._map)
            {
                mapNode = this._map.MapNodes[startingCell.y][startingCell.x];
                
                if(null != mapNode)
                {
                    while(null != mapNode)
                    {
                        if(false == mapNode.isWalkable)
                        {
                            var graphicsWall = mapNode.graphicsWall;

                            if(null != graphicsWall)
                            {
                                // let's search, which specific edge we've collision with
                                var collisionFound:boolean = false;

                                if(graphicsWall.vertices.length >= 2)
                                {
                                    var nodePos = this.tileToPoint(new Vec2(mapNode.x, mapNode.y));

                                    for(var counter = 0; counter < graphicsWall.vertices.length; ++counter)
                                    {
                                        var intersection:Vec2|null = null;

                                        if(0 == counter)
                                        {
                                            intersection = Maze_Common.linesCrossOptimized(
                                                nodePos.x + graphicsWall.vertices[graphicsWall.vertices.length - 1].x, 
                                                nodePos.y + graphicsWall.vertices[graphicsWall.vertices.length - 1].y, 
                                                nodePos.x + graphicsWall.vertices[counter].x, 
                                                nodePos.y + graphicsWall.vertices[counter].y, 
                                                from.x, from.y, to.x, to.y);
                                        }
                                        else
                                        {
                                            intersection = Maze_Common.linesCrossOptimized(
                                                nodePos.x + graphicsWall.vertices[counter - 1].x, 
                                                nodePos.y + graphicsWall.vertices[counter - 1].y, 
                                                nodePos.x + graphicsWall.vertices[counter].x, 
                                                nodePos.y + graphicsWall.vertices[counter].y, 
                                                from.x, from.y, to.x, to.y);
                                        }
                                        
                                        if(null != intersection)
                                        {
                                            collisionFound = true;
                                            
                                            if(result == null)
                                            {
                                                result = intersection;
                                            }
                                            else
                                            {
                                                // compare lengths
                                                var currentLength = result.clone().subtract(from).length();
                                                var candidateLength = intersection.clone().subtract(from).length();
                                                if( candidateLength < currentLength )
                                                {
                                                    result = intersection;
                                                }
                                            }
                                        } 
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
            }
            else
            {
                throw("Error! this._map == null!");
            }

            return result;
        }
    }
}