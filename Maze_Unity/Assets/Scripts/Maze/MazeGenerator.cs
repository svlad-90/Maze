using System.Collections.Generic;
using System;
using Maze_Common;

namespace Maze_MazeGenerator
{
    enum eNeighbourType
    {
        TOP = 0,
        RIGHT = 1,
        BOTTOM = 2,
        LEFT = 3
    }

    class MazeNode
    {
        private int mX;
        public int X { get => mX; }

        private int mY;
        public int Y { get => mY; }

        public MazeNode(int x, int y)
        {
            this.mX = x;
            this.mY = y;
        }

        private MazeNode mTopSibling = null;
        public MazeNode TopSibling { get => mTopSibling; set => mTopSibling = value; }

        private MazeNode mRightSibling = null;
        public MazeNode RightSibling { get => mRightSibling; set => mRightSibling = value; }

        private MazeNode mBottomSibling = null;
        public MazeNode BottomSibling { get => mBottomSibling; set => mBottomSibling = value; }

        private MazeNode mLeftSibling = null;
        public MazeNode LeftSibling { get => mLeftSibling; set => mLeftSibling = value; }

        private bool mVisited = false;
        public bool Visited { get => mVisited; set => mVisited = value; }

        private bool mTopWall = true;
        public bool TopWall { get => mTopWall; set => mTopWall = value; }

        private bool mRightWall = true;
        public bool RightWall { get => mRightWall; set => mRightWall = value; }

        private bool mBottomWall = true;
        public bool BottomWall { get => mBottomWall; set => mBottomWall = value; }

        private bool mLeftWall = true;
        public bool LeftWall { get => mLeftWall; set => mLeftWall = value; }

        public Dictionary<eNeighbourType, MazeNode> getAllNotVisitedNeighbours()
        {
            Dictionary<eNeighbourType, MazeNode> neighbours = new Dictionary<eNeighbourType, MazeNode>();

            if (null != this.mLeftSibling && false == this.mLeftSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.LEFT, this.mLeftSibling);
            }

            if (null != this.mRightSibling && false == this.mRightSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.RIGHT, this.mRightSibling);
            }

            if (null != this.mTopSibling && false == this.mTopSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.TOP, this.mTopSibling);
            }

            if (null != this.mBottomSibling && false == this.mBottomSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.BOTTOM, this.mBottomSibling);
            }

            return neighbours;
        }

        public Dictionary<eNeighbourType, MazeNode> getAllVisitedNeighbours()
        {
            Dictionary<eNeighbourType, MazeNode> neighbours = new Dictionary<eNeighbourType, MazeNode>();

            if (null != this.mLeftSibling && true == this.mLeftSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.LEFT, this.mLeftSibling);
            }

            if (null != this.mRightSibling && true == this.mRightSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.RIGHT, this.mRightSibling);
            }

            if (null != this.mTopSibling && true == this.mTopSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.TOP, this.mTopSibling);
            }

            if (null != this.mBottomSibling && true == this.mBottomSibling.mVisited)
            {
                neighbours.Add(eNeighbourType.BOTTOM, this.mBottomSibling);
            }

            return neighbours;
        }

        public Tuple<eNeighbourType, MazeNode> getRandomNotVisitedNeighbour()
        {
            var neighbours = this.getAllNotVisitedNeighbours();

            if (neighbours.Count > 0)
            {
                int targetIndex = Common.randomRangeInt(0, neighbours.Count);
                int i = 0;
                foreach (var neighbourInfo in neighbours)
                {
                    if (i == targetIndex)
                    {
                        return Tuple.Create(neighbourInfo.Key, neighbourInfo.Value);
                    }

                    i += 1;
                }
            }
            else
            {
                return null;
            }

            return null;
        }

        public Tuple<eNeighbourType, MazeNode> getRandomVisitedNeighbour()
        {
            var neighbours = this.getAllVisitedNeighbours();

            if (neighbours.Count > 0)
            {
                var targetIndex = Common.randomRangeInt(0, neighbours.Count);
                int i = 0;
                foreach (var neighbourInfo in neighbours)
                {
                    if (i == targetIndex)
                    {
                        return Tuple.Create(neighbourInfo.Key, neighbourInfo.Value);
                    }

                    i += 1;
                }
            }
            else
            {
                return null;
            }

            return null;
        }
    }

    class MazeGenerator
    {
        List<List<MazeNode>> generateMaze(int width, int height)
        {
            List<List<MazeNode>> result = new List<List<MazeNode>>();

            if (width > 0 && height > 0)
            {
                // create all nodes
                for (int row = 0; row < height; ++row)
                {
                    result.Add(new List<MazeNode>());

                    for (int column = 0; column < width; ++column)
                    {
                        var mazeNode = new MazeNode(column, row);
                        result[row].Add(mazeNode);
                    }
                }
            }

            // assign nodes to each other
            for (int row = 0; row < height; ++row)
            {
                for (int column = 0; column < width; ++column)
                {
                    if (row > 0)
                    {
                        result[row][column].TopSibling = result[row - 1][column];
                    }

                    if (column > 0)
                    {
                        result[row][column].LeftSibling = result[row][column - 1];
                    }

                    if (row < (height - 1))
                    {
                        result[row][column].BottomSibling = result[row + 1][column];
                    }

                    if (column != (width - 1))
                    {
                        result[row][column].RightSibling = result[row][column + 1];
                    }
                }
            }

            MazeNode startNode = result[Common.randomRangeInt(0, height)][Common.randomRangeInt(0, width)];
            HashSet<MazeNode> frontier = new HashSet<MazeNode>();

            var neighbours = startNode.getAllNotVisitedNeighbours();

            foreach (var neighbourInfo in neighbours)
            {
                frontier.Add(neighbourInfo.Value);
            }
            startNode.Visited = true;

            while (0 != frontier.Count)
            {
                // select random frontier
                var randomFrontierIdx = Common.randomRangeInt(0, frontier.Count);
                MazeNode randomFrontier = result[0][0];

                int i = 0;
                foreach (var frontierElemnt in frontier)
                {
                    if (i == randomFrontierIdx)
                    {
                        randomFrontier = frontierElemnt;
                        break;
                    }

                    i += 1;
                }

                // select "break the wall" visited neighbour
                var randomVisitedNeighbourInfo = randomFrontier.getRandomVisitedNeighbour();

                if (null != randomVisitedNeighbourInfo)
                {
                    switch (randomVisitedNeighbourInfo.Item1)
                    {
                        case eNeighbourType.BOTTOM:
                            randomFrontier.BottomWall = false;
                            randomVisitedNeighbourInfo.Item2.TopWall = false;
                            break;
                        case eNeighbourType.RIGHT:
                            randomFrontier.RightWall = false;
                            randomVisitedNeighbourInfo.Item2.LeftWall = false;
                            break;
                        case eNeighbourType.TOP:
                            randomFrontier.TopWall = false;
                            randomVisitedNeighbourInfo.Item2.BottomWall = false;
                            break;
                        case eNeighbourType.LEFT:
                            randomFrontier.LeftWall = false;
                            randomVisitedNeighbourInfo.Item2.RightWall = false;
                            break;
                    }

                    randomFrontier.Visited = true;

                    var neighbours_ = randomFrontier.getAllNotVisitedNeighbours();

                    foreach (var neighbourInfo in neighbours_)
                    {
                        frontier.Add(neighbourInfo.Value);
                    }

                    frontier.Remove(randomFrontier);
                }
                else
                {
                    throw new System.Exception("Did not find visited neighbours!");
                }
            }

            return result;
        }
    }
}