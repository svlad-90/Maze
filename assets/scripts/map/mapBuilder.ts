import { _decorator, Component, Node, Prefab, Vec2, instantiate, Vec3, UITransform, Graphics, ResolutionPolicy, math, randomRangeInt, Label, Rect } from 'cc';
import { Maze_GraphicsWall } from '../wall/graphicsWall';
import { Maze_MazeGenerator } from '../maze/mazeGenerator';
import { Maze_PriorityQueue } from '../common/priorityQueue/priorityQueue.ts';
import { Maze_Common } from '../common';
const { ccclass, property } = _decorator;

export namespace Maze_MapBuilder
{
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
        }
        public get representationNode():Node|null
        {
            return this._representationNode;
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
                            graphicsWall.NumberOfVertices = 25
                        }
                    }
        
                    this._parentNode.addChild(mapNode.representationNode);
                    mapNode.representationNode.parent = this._parentNode;
                    
                    var leftBottomPoint = this.getLeftBottompWorldPosition();
        
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

        public getLeftBottompWorldPosition() : Vec2
        {
            var parentWorldPosition:Vec3 = this._parentNode.worldPosition;
            var x = parentWorldPosition.x - ( this._width * this._mapNodeSize / 2 );
            var y = parentWorldPosition.y - ( this._height * this._mapNodeSize / 2 );
            return new Vec2(x,y);
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
            var result:Vec2 = new Vec2();

            if(null != this._map)
            {
                result = this._map.getLeftBottompWorldPosition();
            }

            return result;
        }

        public pointToTile(point:Vec2) : Vec2
        {
            var result:Vec2 = new Vec2();

            result = point.clone().subtract(this.getLeftBottompWorldPosition());

            result.x = Math.ceil(result.x / this._mapNodeSize) - 1;
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

        onLoad()
        {
            this.createMap();
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

        filterWalkableTiles( innerRange:math.Rect, outterRange:math.Rect ) : Vec2[]
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
                                    && true == this._map.MapNodes[row][column].isWalkable )
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

        filterWalkableTiles2( range:math.Rect ) : Vec2[]
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
                            if( true == this._map.MapNodes[row][column].isWalkable )
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
    }
}