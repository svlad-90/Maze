import { randomRangeInt } from 'cc';

export namespace Maze_MazeGenerator
{
    enum eNeighbourType
    {
        TOP = 0,
        RIGHT = 1,
        BOTTOM = 2,
        LEFT = 3
    }

    export class MazeNode
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

        private _topSibling:MazeNode|null = null;
        public set topSibling(val:MazeNode|null)
        {
            this._topSibling = val;
        }
        public get topSibling():MazeNode|null
        {
            return this._topSibling;
        }

        private _rightSibling:MazeNode|null = null;
        public set rightSibling(val:MazeNode|null)
        {
            this._rightSibling = val;
        }
        public get rightSibling():MazeNode|null
        {
            return this._rightSibling;
        }
        
        private _bottomSibling:MazeNode|null = null;
        public set bottomSibling(val:MazeNode|null)
        {
            this._bottomSibling = val;
        }
        public get bottomSibling():MazeNode|null
        {
            return this._bottomSibling;
        }

        private _leftSibling:MazeNode|null = null;
        public set leftSibling(val:MazeNode|null)
        {
            this._leftSibling = val;
        }
        public get leftSibling():MazeNode|null
        {
            return this._leftSibling;
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

        private _topWall:boolean = true;
        public set topWall(val:boolean)
        {
            this._topWall = val;
        }
        public get topWall():boolean
        {
            return this._topWall;
        }

        private _rightWall:boolean = true;
        public set rightWall(val:boolean)
        {
            this._rightWall = val;
        }
        public get rightWall():boolean
        {
            return this._rightWall;
        }

        private _bottomWall:boolean = true;
        public set bottomWall(val:boolean)
        {
            this._bottomWall = val;
        }
        public get bottomWall():boolean
        {
            return this._bottomWall;
        }

        private _leftWall:boolean = true;
        public set leftWall(val:boolean)
        {
            this._leftWall = val;
        }
        public get leftWall():boolean
        {
            return this._leftWall;
        }

        public getAllNotVisitedNeighbours():Map<eNeighbourType,MazeNode>
        {
            var neighbours:Map<eNeighbourType,MazeNode> = new Map<eNeighbourType,MazeNode>();

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

        public getAllVisitedNeighbours():Map<eNeighbourType,MazeNode>
        {
            var neighbours:Map<eNeighbourType,MazeNode> = new Map<eNeighbourType,MazeNode>();

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

        public getRandomNotVisitedNeighbour():[eNeighbourType,MazeNode]|undefined
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

        public getRandomVisitedNeighbour():[eNeighbourType,MazeNode]|undefined
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

    export function generateMaze(width:number, height:number):MazeNode[][]
    {
        var result:MazeNode[][] = [];

        if(width > 0 && height > 0)
        {
            // create all nodes
            for(var row:number = 0; row < height; ++row)
            {
                result.push([]);

                for(var column:number = 0; column < width; ++column)
                {
                    var mazeNode = new MazeNode(column, row);                
                    result[row].push(mazeNode);
                }
            }

            // assign nodes to each other
            for(var row:number = 0; row < height; ++row)
            {
                for(var column:number = 0; column < width; ++column)
                {
                    if(row > 0)
                    {
                        result[row][column].topSibling = result[row-1][column];
                    }

                    if(column > 0)
                    {
                        result[row][column].leftSibling = result[row][column-1];
                    }

                    if(row < (height - 1))
                    {
                        result[row][column].bottomSibling = result[row+1][column];
                    }

                    if(column != (width - 1))
                    {
                        result[row][column].rightSibling = result[row][column+1];
                    }
                }
            }

            var startNode:MazeNode = result[randomRangeInt(0,height)][randomRangeInt(0,width)];
            var frontier:Set<MazeNode> = new Set<MazeNode>();

            var neighbours = startNode.getAllNotVisitedNeighbours();

            for(var neighbourInfo of neighbours)
            {
                frontier.add(neighbourInfo[1]);
            }
            startNode.visited = true;

            while(0 != frontier.size)
            {
                // select random frontier
                var randomFrontierIdx = randomRangeInt(0,frontier.size);
                var randomFrontier:MazeNode = result[0][0];
                
                var i:number = 0;
                for(var frontierElemnt of frontier)
                {
                    if(i == randomFrontierIdx)
                    {
                        randomFrontier = frontierElemnt;
                        break;
                    }
                    
                    i += 1;
                }

                // select "break the wall visited neighbour
                var randomVisitedNeighbourInfo = randomFrontier.getRandomVisitedNeighbour();

                if(null != randomVisitedNeighbourInfo)
                {
                    switch(randomVisitedNeighbourInfo[0])
                    {
                        case eNeighbourType.BOTTOM:
                            randomFrontier.bottomWall = false;
                            randomVisitedNeighbourInfo[1].topWall = false;
                            break;
                        case eNeighbourType.RIGHT:
                            randomFrontier.rightWall = false;
                            randomVisitedNeighbourInfo[1].leftWall = false;
                            break;
                        case eNeighbourType.TOP:
                            randomFrontier.topWall = false;
                            randomVisitedNeighbourInfo[1].bottomWall = false;
                            break;
                        case eNeighbourType.LEFT:
                            randomFrontier.leftWall = false;
                            randomVisitedNeighbourInfo[1].rightWall = false;
                            break;
                    }

                    randomFrontier.visited = true;
                    
                    var neighbours = randomFrontier.getAllNotVisitedNeighbours();

                    for(var neighbourInfo of neighbours)
                    {
                        frontier.add(neighbourInfo[1]);
                    }

                    frontier.delete(randomFrontier);
                }
                else
                {
                    throw("Did not find visited neighbours!");
                }
            }
        }

        return result;
    }
}