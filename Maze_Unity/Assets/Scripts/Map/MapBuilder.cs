using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Pool;
using Unity.Mathematics;
using Draw2DShapesLite;
using Maze_Wall;
using Maze_MazeGenerator;
using Maze_Common;
using Maze_EasyReference;
using Maze_Optional;
using Maze_Deque;
using Priority_Queue;

namespace Maze_MapBuilder
{
    class MapPriorityQueueNode : FastPriorityQueueNode 
    {
        private MapNode mapNode;
        public MapNode MapNode { get => mapNode; set => mapNode = value; }

        public MapPriorityQueueNode(MapNode mapNode)
        {
            this.MapNode = mapNode;
        }
    }
    enum eNeighbourType
    {
        TOP = 0,
        RIGHT = 1,
        BOTTOM = 2,
        LEFT = 3
    }

    class MapNode
    {
        private int mX;
        public int X { get => mX; }

        private int mY;
        public int Y { get => mY; }

        private Vector2Int mTileCoord;

        public Vector2Int TileCoord { get => mTileCoord; }

        public MapNode(int x, int y)
        {
            mX = x;
            mY = y;
            mTileCoord = new Vector2Int(mX, mY);
        }

        private MapNode mTopSibling;
        public MapNode TopSibling { get => mTopSibling; set => mTopSibling = value; }

        private MapNode mRightSibling;
        public MapNode RightSibling { get => mRightSibling; set => mRightSibling = value; }

        private MapNode mBottomSibling;
        public MapNode BottomSibling { get => mBottomSibling; set => mBottomSibling = value; }

        private MapNode mLeftSibling;
        public MapNode LeftSibling { get => mLeftSibling; set => mLeftSibling = value; }

        private bool mIsWalkable = true;
        public bool IsWalkable { get => mIsWalkable; set => mIsWalkable = value; }

        private GameObject mFloorObject;
        public GameObject FloorObject
        {
            get => mFloorObject;
            set
            {
                mFloorObject = value;

                if (null != mFloorObject)
                {
                    mFloorSprite = mFloorObject.GetComponent<SpriteRenderer>();
                }
            }
        }

        private GameObject mWallObject;
        public GameObject WallObject
        {
            get => mWallObject;
            set
            {
                    mWallObject = value;

                if (null != mWallObject)
                {
                    mWallComponent = mWallObject.GetComponent<Wall>();
                }
            }
        }

        private Wall mWallComponent;
        public Wall WallComponent
        {
            get => mWallComponent;
        }

        private SpriteRenderer mFloorSprite;
        public SpriteRenderer FloorSprite
        {
            get => mFloorSprite;
        }

        private GameObject mLabel;
        public GameObject Label { get => mLabel; set => mLabel = value; }

        private bool mVisited = false;
        public bool Visited { get => mVisited; set => mVisited = value; }

        public int getCost()
        {
            return 1;
        }

        public Dictionary<eNeighbourType, MapNode> getAllNotVisitedNeighbours()
        {
            Dictionary<eNeighbourType, MapNode> neighbours = new Dictionary<eNeighbourType, MapNode>();

            if (null != mLeftSibling && false == mLeftSibling.Visited)
            {
                neighbours.Add(eNeighbourType.LEFT, LeftSibling);
            }
            
            if (null != RightSibling && false == RightSibling.Visited)
            {
                neighbours.Add(eNeighbourType.RIGHT, RightSibling);
            }

            if (null != TopSibling && false == TopSibling.Visited)
            {
                neighbours.Add(eNeighbourType.TOP, TopSibling);
            }

            if (null != BottomSibling && false == BottomSibling.Visited)
            {
                neighbours.Add(eNeighbourType.BOTTOM, BottomSibling);
            }

            return neighbours;
        }

        public Dictionary<eNeighbourType, MapNode> getAllVisitedNeighbours()
        {
            Dictionary<eNeighbourType, MapNode> neighbours = new Dictionary<eNeighbourType, MapNode>();

            if (null != LeftSibling && true == LeftSibling.Visited)
            {
                neighbours.Add(eNeighbourType.LEFT, LeftSibling);
        }

            if (null != RightSibling && true == RightSibling.Visited)
            {
                neighbours.Add(eNeighbourType.RIGHT, RightSibling);
        }

            if (null != TopSibling && true == TopSibling.Visited)
            {
                neighbours.Add(eNeighbourType.TOP, TopSibling);
        }

            if (null != BottomSibling && true == BottomSibling.Visited)
            {
                neighbours.Add(eNeighbourType.BOTTOM, BottomSibling);
        }

            return neighbours;
        }

        public ValueTuple<bool, KeyValuePair<eNeighbourType, MapNode>> getRandomNotVisitedNeighbour()
        {
            var neighbours = getAllNotVisitedNeighbours();

            if (neighbours.Count > 0)
            {
                var targetIndex = Common.randomRangeInt(0, neighbours.Count);
                int i = 0;
                foreach(var neighbourInfo in neighbours)
                {
                    if (i == targetIndex)
                    {
                        return ValueTuple.Create(true, neighbourInfo);
                    }

                    i += 1;
                }
            }
            
            return ValueTuple.Create(false, new KeyValuePair<eNeighbourType, MapNode>(eNeighbourType.BOTTOM, null));
        }

        public ValueTuple<bool, KeyValuePair<eNeighbourType, MapNode>> getRandomVisitedNeighbour()
        {
            var neighbours = getAllVisitedNeighbours();

            if (neighbours.Count > 0)
            {
                var targetIndex = Common.randomRangeInt(0, neighbours.Count);
                int i = 0;

                foreach (var neighbourInfo in neighbours)
                {
                    if (i == targetIndex)
                    {
                         return ValueTuple.Create(true, neighbourInfo);
                    }

                    i += 1;
                }
            }

            return ValueTuple.Create(false, new KeyValuePair<eNeighbourType, MapNode>(eNeighbourType.BOTTOM, null));
        }
    }

    class LevelMap
    {
        private List<List<MapNode>> mMapNodes = new List<List<MapNode>>();
        public List<List<MapNode>> MapNodes { get => mMapNodes; }

        private GameObject mParentGameObject;
        private int mWidth;
        private int mHeight;
        private float mMapNodeSize;
        private GameObject mFloorPrefab;
        private GameObject mWallPrefab;
        private List<Vector2> mCircleRays = new List<Vector2>();
        private EasyReference mEasyReference;
        private Dictionary<String, ObjectPool<GameObject>> mGameObjectPoolMap = new Dictionary<String, ObjectPool<GameObject>>();
        private GameObject mDefaultWallGameObject;
        private Maze_Wall.Wall mDefaultWall;

        public void resetVisitFlag()
        {
            for (int row = 0; row < mHeight; ++row)
                    {
                for (int column = 0; column < mWidth; ++column)
                {
                    mMapNodes[row][column].Visited = false;
                }
            }
        }

        public void generateMaze()
        {
            resetVisitFlag();

            // We need to check what would be the effective size of the maze, that we are working with.
            // Only 2*y + 1 rows and 2*x + 1 columns would be used in generation 
            int effectiveWidth = 0;
            int effectiveHeight = 0;

            if (mWidth > 0 && mHeight > 0)
            {
                effectiveWidth = mWidth % 2 == 0 ? mWidth - 1 : mWidth;
                effectiveHeight = mHeight % 2 == 0 ? mHeight - 1 : mHeight;

                if (effectiveWidth > 0 && effectiveHeight > 0)
                {
                    int widthInCells = (effectiveWidth - 1) / 2;
                    int heightInCells = (effectiveWidth - 1) / 2;

                    if (widthInCells > 0 && heightInCells > 0)
                    {
                        // we can start generation at this point
                        var maze = MazeGenerator.generateMaze(widthInCells, heightInCells);

                        if (maze.Count == heightInCells)
                        {
                            // fill in the walkable data
                            for (int row = 0; row < maze.Count; ++row)
                            {
                                if (maze[row].Count == widthInCells)
                                {
                                    for (int column = 0; column < maze[row].Count; ++column)
                                    {
                                        // READY
                                        if (false == mMapNodes[row * 2][column * 2].Visited)
                                        {
                                            mMapNodes[row * 2][column * 2].IsWalkable = !(maze[row][column].LeftWall || maze[row][column].TopWall);

                                            var leftSibling = maze[row][column].LeftSibling;
    
                                            if (null != leftSibling && true == mMapNodes[row * 2][column * 2].IsWalkable)
                                            {
                                                mMapNodes[row * 2][column * 2].IsWalkable = !leftSibling.TopWall;

                                                var topSibling = leftSibling.TopSibling;

                                                if (null != topSibling && true == mMapNodes[row * 2][column * 2].IsWalkable)
                                                {
                                                    mMapNodes[row * 2][column * 2].IsWalkable = !topSibling.RightWall;
                                                }
                                            }

                                            mMapNodes[row * 2][column * 2].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2][column * 2 + 1].Visited)
                                        {
                                            mMapNodes[row * 2][column * 2 + 1].IsWalkable = !(maze[row][column].TopWall);
                                            mMapNodes[row * 2][column * 2 + 1].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2][column * 2 + 2].Visited)
                                        {
                                            mMapNodes[row * 2][column * 2 + 2].IsWalkable = !(maze[row][column].TopWall || maze[row][column].RightWall);

                                            var rightSibling = maze[row][column].RightSibling;

                                            if (null != rightSibling && true == mMapNodes[row * 2][column * 2 + 2].IsWalkable)
                                            {
                                                mMapNodes[row * 2][column * 2 + 2].IsWalkable = !rightSibling.TopWall;

                                                var topSibling = rightSibling.TopSibling;

                                                if (null != topSibling && true == mMapNodes[row * 2][column * 2 + 2].IsWalkable)
                                                {
                                                    mMapNodes[row * 2][column * 2].IsWalkable = !topSibling.LeftWall;
                                                }
                                            }

                                            mMapNodes[row * 2][column * 2 + 2].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 1][column * 2].Visited)
                                        {
                                            mMapNodes[row * 2 + 1][column * 2].IsWalkable = !(maze[row][column].LeftWall);
                                            mMapNodes[row * 2 + 1][column * 2].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 1][column * 2 + 1].Visited)
                                        {
                                            mMapNodes[row * 2 + 1][column * 2 + 1].IsWalkable = true;
                                            mMapNodes[row * 2 + 1][column * 2 + 1].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 1][column * 2 + 2].Visited)
                                        {
                                            mMapNodes[row * 2 + 1][column * 2 + 2].IsWalkable = !(maze[row][column].RightWall);
                                            mMapNodes[row * 2 + 1][column * 2 + 2].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 2][column * 2].Visited)
                                        {
                                            mMapNodes[row * 2 + 2][column * 2].IsWalkable = !(maze[row][column].LeftWall || maze[row][column].BottomWall);

                                            var leftSibling = maze[row][column].LeftSibling;

                                            if (null != leftSibling && true == mMapNodes[row * 2 + 2][column * 2].IsWalkable)
                                            {
                                                mMapNodes[row * 2 + 2][column * 2].IsWalkable = !leftSibling.BottomWall;

                                                var bottomSibling = leftSibling.BottomSibling;

                                                if (null != bottomSibling && true == mMapNodes[row * 2 + 2][column * 2].IsWalkable)
                                                {
                                                    mMapNodes[row * 2 + 2][column * 2].IsWalkable = !bottomSibling.RightWall;
                                                }
                                            }

                                            mMapNodes[row * 2 + 2][column * 2].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 2][column * 2 + 1].Visited)
                                        {
                                            mMapNodes[row * 2 + 2][column * 2 + 1].IsWalkable = !(maze[row][column].BottomWall);
                                            mMapNodes[row * 2 + 2][column * 2 + 1].Visited = true;
                                        }

                                        // READY
                                        if (false == mMapNodes[row * 2 + 2][column * 2 + 2].Visited)
                                        {
                                            mMapNodes[row * 2 + 2][column * 2 + 2].IsWalkable = !(maze[row][column].BottomWall || maze[row][column].RightWall);

                                            var rightSibling = maze[row][column].RightSibling;

                                            if (null != rightSibling && true == mMapNodes[row * 2 + 2][column * 2 + 2].IsWalkable)
                                            {
                                                mMapNodes[row * 2 + 2][column * 2 + 2].IsWalkable = !rightSibling.BottomWall;

                                                var bottomSibling = rightSibling.BottomSibling;

                                                if (null != bottomSibling && true == mMapNodes[row * 2 + 2][column * 2 + 2].IsWalkable)
                                                {
                                                    mMapNodes[row * 2 + 2][column * 2 + 2].IsWalkable = !bottomSibling.LeftWall;
                                                }
                                            }

                                            mMapNodes[row * 2 + 2][column * 2 + 2].Visited = true;
                                        }
                                    }
                                }
                                else
                                {
                                    throw new System.Exception("[LevelMap][generateMaze] maze[row].length != widthInCells");
                                }
                            }
                        }
                        else
                        {
                            throw new System.Exception("[LevelMap][generateMaze] maze.length != widthInCells");
                        }
                    }
                }
            }
        }

        private Optional<Vector2> mLeftBottomWorldPosition;

        public Vector2 getLeftBottompWorldPosition()
        {
            if (false == mLeftBottomWorldPosition.HasValue)
            {
                Vector3 parentWorldPosition = mParentGameObject.transform.position;
                var x = parentWorldPosition.x - (mWidth * mMapNodeSize / 2);
                var y = parentWorldPosition.y - (mHeight * mMapNodeSize / 2);
                mLeftBottomWorldPosition = new Vector2(x, y);
            }

            return mLeftBottomWorldPosition.Value;
        }
        
        public void pointToTileOut(Vector2 point, ref Vector2Int result)
        {
            Vector2 tmp = point;
            tmp = tmp - getLeftBottompWorldPosition();
            result.x = Mathf.FloorToInt(tmp.x / mMapNodeSize);
            result.y = Mathf.CeilToInt(mHeight - (tmp.y / mMapNodeSize));
        }

        public Vector2Int pointToTile(Vector2 point)
        {
            Vector2Int result = new Vector2Int();
            pointToTileOut(point, ref result);
            return result;
        }

        public void tileToPointOut(Vector2Int tile, ref Vector2 result)
        {
            try
            {
                var leftBottomPoint = getLeftBottompWorldPosition();

                result.x = leftBottomPoint.x + (tile.x* mMapNodeSize) + (mMapNodeSize / 2);
                result.y = leftBottomPoint.y + ((mHeight - tile.y) * mMapNodeSize) + (mMapNodeSize / 2);
            }
            catch
            {
                throw new System.Exception("[LevelMap][tileToPoint] Error!");
            }
        }

        public Vector2 tileToPoint(Vector2Int tile)
        {
            Vector2 result = new Vector2();
            tileToPointOut(tile, ref result);
            return result;
        }

        public RectInt normalizeRect(RectInt rect)
        {
            RectInt result = new RectInt();

            if (rect.x< 0)
            {
                result.x = 0;
            }
            else if (rect.x >= mWidth)
            {
                result.x = mWidth - 1;
            }
            else
            {
                result.x = rect.x;
            }

            if (rect.y < 0)
            {
                result.y = 0;
            }
            else if (rect.y >= mHeight)
            {
                result.y = mHeight - 1;
            }
            else
            {
                result.y = rect.y;
            }

            if (rect.width < 0)
            {
                result.width = 0;
            }
            else if (result.x + rect.width > mHeight)
            {
                result.width = mWidth - result.x;
            }
            else
            {
                result.width = rect.width;
            }

            if (rect.height < 0)
            {
                result.height = 0;
            }
            else if (result.y + rect.height > mHeight)
            {
                result.height = mHeight - result.y;
            }
            else
            {
                result.height = rect.height;
            }

            return result;
        }

        enum ePoolType
        {
            Wall = 0,
            Floor
        }

        private ObjectPool<GameObject> findOrCreateObjectsPool(string name, ePoolType poolType)
        {
            ObjectPool<GameObject> objectsPool = null;

            Func<GameObject> createFunc = () => { return null; };
            Action<GameObject> actionOnGet = (GameObject obj) => {};

            switch (poolType)
            {
                case ePoolType.Floor:
                    createFunc = () =>
                    {
                        if (null != mFloorPrefab)
                        {
                            var floorInstance = GameObject.Instantiate(mFloorPrefab);
                            var spriteRenderer = floorInstance.GetComponent<SpriteRenderer>();

                            if(null != spriteRenderer)
                            {
                                spriteRenderer.size = new Vector2(mMapNodeSize, mMapNodeSize);
                            }

                            return floorInstance;
                        }
                        else
                        {
                            throw new System.Exception("[LevelMap][findOrCreateObjectsPool] Error! mFloorPrefab == null");
                        }
                    };

                    actionOnGet = (GameObject obj) =>
                    {
                        obj.SetActive(true);
                    };
                    break;
                case ePoolType.Wall:
                    createFunc = () =>
                    {
                        if (null != mWallPrefab)
                        {
                            var wallInstance = GameObject.Instantiate(mWallPrefab);

                            var wall = wallInstance.GetComponent<Wall>();

                            if (wall != null)
                            {
                                wall.Dimensions = new Vector2(mMapNodeSize, mMapNodeSize);
                                wall.ExcludeFromCenterFactor = 0.9f;
                                wall.NumberOfVertices = 25;
                                wall.generateVertices();
                            }
                            else
                            {
                                throw new System.Exception("[LevelMap][findOrCreateObjectsPool] Error! Wall prefab does not contain Wall component!");
                            }

                            return wallInstance;
                        }
                        else
                        {
                            throw new System.Exception("[LevelMap][findOrCreateObjectsPool] Error! mWallPrefab == null");
                        }
                    };

                    actionOnGet = (GameObject obj) =>
                    {
                        obj.SetActive(true);
                    };
                    break;
            }

            if (false == mGameObjectPoolMap.TryGetValue(name, out objectsPool))
            {
                objectsPool = new ObjectPool<GameObject>(
                createFunc: createFunc,
                actionOnGet: actionOnGet,
                actionOnRelease: (GameObject obj) =>
                {
                    // TODO

                    obj.SetActive(false);
                });
                mGameObjectPoolMap.Add(name, objectsPool);
            }

            return objectsPool;
        }

        public void assignRepresentationNodes(MapNode mapNode)
        {
            if (null != mapNode)
            {
                if (false == mapNode.IsWalkable && null == mapNode.WallObject)
                {
                    GameObject wallObjectInstance;

                    var nodePool = findOrCreateObjectsPool(mWallPrefab.name, ePoolType.Wall);

                    if (null != nodePool)
                    {
                        wallObjectInstance = nodePool.Get();

                        if (null != wallObjectInstance)
                        {
                            mapNode.WallObject = wallObjectInstance;
                            wallObjectInstance.transform.parent = mParentGameObject.transform;

                            var leftBottomPoint = getLeftBottompWorldPosition();

                            var x = leftBottomPoint.x + (mapNode.X * mMapNodeSize) + (mMapNodeSize / 2);
                            var y = leftBottomPoint.y + ((mHeight - mapNode.Y) * mMapNodeSize) + (mMapNodeSize / 2);

                            mapNode.WallObject.transform.position = new Vector3(x, y, 0);
                        }
                        else
                        {
                            throw new System.Exception("[LevelMap][findOrCreateObjectsPool] Error! wallObjectInstance == null!");
                        }
                    }
                }

                if (null != mFloorPrefab)
                {
                    GameObject floorNodeInstance;

                    var nodePool = findOrCreateObjectsPool(mFloorPrefab.name, ePoolType.Floor);

                    if (null != nodePool)
                    {
                        floorNodeInstance = nodePool.Get();

                        mapNode.FloorObject = floorNodeInstance;

                        mapNode.FloorObject.transform.parent = mParentGameObject.transform;

                        var leftBottomPoint = getLeftBottompWorldPosition();

                        var x = leftBottomPoint.x + (mapNode.X * mMapNodeSize) + (mMapNodeSize / 2);
                        var y = leftBottomPoint.y + ((mHeight - mapNode.Y) * mMapNodeSize) + (mMapNodeSize / 2);

                        mapNode.FloorObject.transform.position = new Vector3(x, y, 0);
                    }
                    else
                    {
                        throw new System.Exception("[LevelMap][findOrCreateObjectsPool] Error! floorNodeInstance == null!");
                    }
                }
            }
        }

        public void releaseRepresentationNodes(MapNode mapNode)
        {
            if (null != mapNode)
            {
                if (null != mapNode.WallObject)
                {
                    var nodePool = findOrCreateObjectsPool(mWallPrefab.name, ePoolType.Wall);

                    if (null != nodePool)
                    {
                        nodePool.Release(mapNode.WallObject);
                        mapNode.WallObject = null;
                    }
                    else
                    {
                        throw new System.Exception("[LevelMap][releaseRepresentationNodes] Error! objectsPool == null!");
                    }
                }

                if (null != mapNode.FloorObject)
                {
                    var nodePool = findOrCreateObjectsPool(mFloorPrefab.name, ePoolType.Floor);

                    if (null != nodePool)
                    {
                        nodePool.Release(mapNode.FloorObject);
                        mapNode.FloorObject = null;
                    }
                    else
                    {
                        throw new System.Exception("[LevelMap][releaseRepresentationNodes] Error! objectsPool == null!");
                    }
                }
            }
        }

        private RectInt mCurrentVisibleCellsRect;

        public void determineVisibleCells()
        {
            if (null != mEasyReference && null != mEasyReference.Camera)
            {
                var screenSize = mEasyReference.ScreenSize();
                var centerPoint = Common.toVec2(mEasyReference.Camera.ScreenToWorldPoint(new Vector3(screenSize.xMax / 2, screenSize.yMax / 2, 0)));
                var topLeftPoint = Common.toVec2(mEasyReference.Camera.ScreenToWorldPoint(new Vector3(0, screenSize.yMax, 0)));
                var bottomRightPoint = Common.toVec2(mEasyReference.Camera.ScreenToWorldPoint(new Vector3(screenSize.xMax, 0, 0)));

                var tmp = mEasyReference.Camera.WorldToScreenPoint(new Vector3(100, 100, 0));

                var topLeftTileCoord = pointToTile(topLeftPoint);
                var bottomRightTileCoord = pointToTile(bottomRightPoint);

                int additionalRange = 3;

                var newVisibleRect = new RectInt(topLeftTileCoord.x - additionalRange, topLeftTileCoord.y - additionalRange, bottomRightTileCoord.x - topLeftTileCoord.x + additionalRange * 2, bottomRightTileCoord.y - topLeftTileCoord.y + additionalRange * 2);
                newVisibleRect = normalizeRect(newVisibleRect);

                if (false == mCurrentVisibleCellsRect.Equals(newVisibleRect))
                {
                    var intersectionRect = Common.IntersectRectInt(mCurrentVisibleCellsRect, newVisibleRect);

                    for (var row = mCurrentVisibleCellsRect.y; row < mCurrentVisibleCellsRect.yMax; ++row)
                    {
                        for (var column = mCurrentVisibleCellsRect.x; column < mCurrentVisibleCellsRect.xMax; ++column)
                        {
                            var mapNode = mMapNodes[row][column];

                            if ((row < intersectionRect.y || row >= intersectionRect.yMax) ||
                               (column < intersectionRect.x || column >= intersectionRect.xMax))
                            {
                                releaseRepresentationNodes(mapNode);
                            }
                            else
                            {
                                assignRepresentationNodes(mapNode);
                            }
                        }
                    }

                    for (var row = newVisibleRect.y; row < newVisibleRect.yMax; ++row)
                    {
                        for (var column = newVisibleRect.x; column < newVisibleRect.xMax; ++column)
                        {
                            var mapNode = mMapNodes[row][column];

                            if ((row < intersectionRect.y || row >= intersectionRect.yMax) ||
                               (column < intersectionRect.x || column >= intersectionRect.xMax))
                            {
                                assignRepresentationNodes(mapNode);
                            }
                        }
                    }

                    mCurrentVisibleCellsRect = newVisibleRect;
                }
            }
        }

        public LevelMap(GameObject parentNode,
            int width,
            int height,
            float mapNodeSize,
            GameObject floorPrefab,
            GameObject wallPrefab,
            bool debug)
        {
            mEasyReference = new Maze_EasyReference.EasyReference(parentNode);

            var iMax = 72;
            for (var i = 0; i < iMax; ++i)
            {
                var circleVector = Quaternion.AngleAxis(i * (360 / iMax), Common.upVector) * Common.upVector;
                mCircleRays.Add(circleVector);
            }
 
            mParentGameObject = parentNode;
            mWidth = width;
            mHeight = height;
            mMapNodeSize = mapNodeSize;
            mFloorPrefab = floorPrefab;
            mWallPrefab = wallPrefab;

            // create all nodes
            for (int row = 0; row < height; ++row)
            {
                mMapNodes.Add(new List<MapNode>());

                for (int column = 0; column < width; ++column)
                {
                    var mapNode = new MapNode(column, row);

                    mapNode.IsWalkable = false; // all are the walls from the beginning

                    mMapNodes[row].Add(mapNode);
                }
            }

            // assign nodes to each other
            for (int row = 0; row < height; ++row)
            {
                for (int column = 0; column < width; ++column)
                {
                    if (row > 0)
                    {
                        mMapNodes[row][column].TopSibling = mMapNodes[row - 1][column];
                    }

                    if (column > 0)
                    {
                        mMapNodes[row][column].LeftSibling = mMapNodes[row][column - 1];
                    }

                    if (row < (height - 1))
                    {
                        mMapNodes[row][column].BottomSibling = mMapNodes[row + 1][column];
                    }

                    if (column != (width - 1))
                    {
                        mMapNodes[row][column].RightSibling = mMapNodes[row][column + 1];
                    }
                }
            }

            mDefaultWallGameObject = new GameObject();
            mDefaultWallGameObject.AddComponent<Maze_Wall.Wall>();
            mDefaultWallGameObject.SetActive(false);
            mDefaultWallGameObject.transform.parent = parentNode.transform;
            mDefaultWall = mDefaultWallGameObject.GetComponent<Maze_Wall.Wall>();

            if (null != mDefaultWall)
            {
                mDefaultWall.Dimensions = new Vector2(mMapNodeSize, mMapNodeSize);
                mDefaultWall.ExcludeFromCenterFactor = 1;
                mDefaultWall.NumberOfVertices = 4;
            }
            else
            {
                throw new System.Exception("[LevelMap][LevelMap] Error! _defaultWallObject == null!");
            }

            // generate maze
            generateMaze();

            // create representation nodes
            determineVisibleCells();

            if (true == debug)
            {
                for (int row = 0; row < height; ++row)
                {
                    for (int column = 0; column < width; ++column)
                            {
                        var mapNode = mMapNodes[row][column];

                        var leftBottomPoint = getLeftBottompWorldPosition();

                        var x = leftBottomPoint.x + (mapNode.X * mMapNodeSize) + (mMapNodeSize / 2);
                        var y = leftBottomPoint.y + ((mHeight - mapNode.Y) * mMapNodeSize) + (mMapNodeSize / 2);

                        mapNode.Label = new GameObject();
                        mapNode.Label.transform.parent = mParentGameObject.transform;
                        mapNode.Label.AddComponent<Text>();
                        mapNode.Label.transform.position = new Vector3(x, y, 0);

                        var label = mapNode.Label.GetComponent<Text>();

                        if (null != label)
                        {
                            label.text = mapNode.X.ToString() + ", " + mapNode.Y.ToString();
                        }
                    }
                }
            }
        }

        // Manhattan distance on a square grid
        private int heuristic(int rowA, int colA, int rowB, int colB)
        {
            return math.abs(colA - colB) + math.abs(rowA - rowB);
        }

        public List<MapNode> findPath(MapNode start, MapNode finish)
        {
            List<MapNode>  result = new List<MapNode>();

            if (start.X >= 0 && start.X<mHeight
            && start.Y >= 0 && start.Y<mWidth
            && finish.X >= 0 && finish.X< mHeight
            && finish.Y >= 0 && finish.Y< mWidth)
            {
                resetVisitFlag();

                FastPriorityQueue<MapPriorityQueueNode> frontier = new FastPriorityQueue<MapPriorityQueueNode>(mWidth * mHeight);
            
                frontier.Enqueue(new MapPriorityQueueNode(start), 0);

                start.Visited = true;
                Dictionary<MapNode, MapNode> came_from = new Dictionary<MapNode, MapNode>();
                Dictionary<MapNode, int> cost_so_far = new Dictionary<MapNode, int>();

                came_from.Add(start, null);
                cost_so_far.Add(start, 0);

                while (0 != frontier.Count)
                {
                    MapPriorityQueueNode current = frontier.Dequeue();

                    if (current.MapNode == finish)
                    {
                        result.Add(finish);

                        var backtrace_node = came_from[finish];

                        while (backtrace_node != start && null != backtrace_node)
                        {
                            result.Add(backtrace_node);
                            backtrace_node = came_from[backtrace_node];
                        }

                        result.Reverse();

                        break;
                    }

                    var cost_so_far_for_current_node = cost_so_far[current.MapNode];
                    var neighbours = current.MapNode.getAllNotVisitedNeighbours();

                    foreach(var next in neighbours)
                    {
                        if (true == next.Value.IsWalkable) // skip the walls
                        {
                            int new_cost = cost_so_far_for_current_node + next.Value.getCost();

                            cost_so_far.Add(next.Value, new_cost);

                            var cost_so_far_for_next_node = cost_so_far[next.Value];

                            int priority = new_cost + heuristic(finish.Y, finish.X, next.Value.Y, next.Value.X);
                            frontier.Enqueue(new MapPriorityQueueNode(next.Value), priority);
                            came_from.Add(next.Value, current.MapNode);
                            next.Value.Visited = true;
                        }
                    }
                }
            }
            else
            {
                throw new System.Exception("[LevelMap][findPath] Error! Wrong input parameters!");
            }

            return result;
        }

        public eNeighbourType invertNeighbourType(eNeighbourType neighbourType)
        {
            switch (neighbourType)
            {
                case eNeighbourType.BOTTOM: return eNeighbourType.TOP;
                case eNeighbourType.TOP: return eNeighbourType.BOTTOM;
                case eNeighbourType.LEFT: return eNeighbourType.RIGHT;
                case eNeighbourType.RIGHT: return eNeighbourType.LEFT;
            }

            throw new System.Exception("[LevelMap][invertNeighbourType] Unhandled value!");
        }

        public MapNode getInvertedNeighbour(MapNode mapNode, eNeighbourType neighbourType)
        {
            if (null != mapNode)
            {
                switch (neighbourType)
                {
                    case eNeighbourType.BOTTOM:
                        return mapNode.TopSibling;
                    case eNeighbourType.TOP:
                        return mapNode.BottomSibling;
                    case eNeighbourType.LEFT:
                        return mapNode.RightSibling;
                    case eNeighbourType.RIGHT:
                        return mapNode.LeftSibling;
                }
            }

            return null;
        }

        public List<Vector2Int> filterTiles(RectInt innerRange, RectInt outterRange, bool walkable = true)
        {
            List<Vector2Int> result = new List<Vector2Int>();

            if (0 != mMapNodes.Count)
            {
                RectInt innerRangeNormalized = normalizeRect(innerRange);
                RectInt outerRangeNormalized = normalizeRect(outterRange);

                for (int row = outerRangeNormalized.y; row<outerRangeNormalized.yMax; ++row)
                {
                    for (int column = outerRangeNormalized.x; column<outerRangeNormalized.xMax; ++column)
                    {
                        if ((column<innerRangeNormalized.x || column> innerRangeNormalized.xMax - 1
                            || row<innerRangeNormalized.y || row> innerRangeNormalized.yMax - 1)
                            && walkable == mMapNodes[row][column].IsWalkable)
                        {
                            result.Add(new Vector2Int(column, row));
                        }
                    }
                }
            }

            return result;
        }

        public List<Vector2Int> filterTiles2(RectInt range, bool walkable = true)
        {
            List<Vector2Int> result = new List<Vector2Int>();

            RectInt rangeNormalized = normalizeRect(range);

            for (int row = rangeNormalized.y; row<rangeNormalized.yMax; ++row)
            {
                for (int column = rangeNormalized.x; column<rangeNormalized.xMax; ++column)
                {
                    if (walkable == mMapNodes[row][column].IsWalkable)
                    {
                        result.Add(new Vector2Int(column, row));
                    }
                }
            }

            return result;
        }

        public List<MapNode> getReachableCells(Vector2Int targetPoint, int minCellDistance, int maxCellDistance)
        {
            List<MapNode> result = new List<MapNode>();

            if (targetPoint.x > 0 && targetPoint.x<mHeight
            && targetPoint.y> 0 && targetPoint.y<mWidth)
            {
                var start = mMapNodes[targetPoint.y][targetPoint.x];

                resetVisitFlag();

                Deque<MapNode> frontierCurrent = new Deque<MapNode>();
                Deque<MapNode> frontierNext = new Deque<MapNode>();

                frontierCurrent.AddToBack(start);

                HashSet<MapNode> came_from = new HashSet<MapNode>();

                if (0 == minCellDistance)
                {
                    came_from.Add(start);
                }

                start.Visited = true;

                for (int i = 0; i<maxCellDistance; ++i)
                {
                    if (frontierCurrent.Count > 0)
                    {
                        while (frontierCurrent.Count > 0)
                        {
                            MapNode current = frontierCurrent.RemoveFromBack();

                            var neighbors = current.getAllNotVisitedNeighbours();

                            foreach(var next in neighbors)
                            {
                                if (true == next.Value.IsWalkable) // skip the walls
                                {
                                    if (false == came_from.Contains(next.Value))
                                    {
                                        frontierNext.AddToBack(next.Value);
                                        if (i + 1 >= minCellDistance)
                                        {
                                            came_from.Add(next.Value);
                                        }
                                    }
                                }
                            }

                            current.Visited = true;
                        }

                        Common.swapReferences(ref frontierCurrent, ref frontierNext);
                    }
                    else
                    {
                        break;
                    }
                }

                foreach (var cameFromItem in came_from)
                {
                    result.Add(cameFromItem);
                }
            }
            else
            {
                throw new System.Exception("[LevelMap][getReachableCells] Error! Wrong input parameters!");
            }

            return result;
        }

        // returns closest collision with the wall
        public ValueTuple<bool, ValueTuple<float, float>> raycast(Vector2 from, Vector2 to)
        {
            ValueTuple<bool, ValueTuple<float, float>> result = ValueTuple.Create(false, new ValueTuple<float, float>(0,0));

            // we should take the cell which contains the starting point.
            var startingCell = pointToTile(from);
            HashSet<eNeighbourType> skipEdges = new HashSet<eNeighbourType>();
            MapNode mapNode = null;
            var nodePos = new Vector2();
            Vector2 intersectionPoint = new Vector2();

            bool cornerCaseHandlerIsActive = false;
            MapNode cornerCaseHandlerFirstNode = null;
            MapNode cornerCaseHandlerSecondNode = null;
            MapNode cornerCaseHandlerThirdNode = null;
            eNeighbourType cornerCaseHandlerThirdNodeFirstSkipEdge = eNeighbourType.BOTTOM;
            eNeighbourType cornerCaseHandlerThirdNodeSecondSkipEdge = eNeighbourType.BOTTOM;

            Action switchToNextNode = () =>
            {
                Action switchToNextNodeSubFlow = () =>
                {
                    List<ValueTuple<MapNode, eNeighbourType>> foundIntersections = new List<ValueTuple<MapNode, eNeighbourType>>();

                    if (null != mapNode)
                    {
                        var recrXMin = nodePos.x - mMapNodeSize / 2;
                        var rectYMin = nodePos.y - mMapNodeSize / 2;
                        var rectXMax = nodePos.x + mMapNodeSize / 2;
                        var rectYMax = nodePos.y + mMapNodeSize / 2;

                        if (foundIntersections.Count < 2 && false == skipEdges.Contains(eNeighbourType.LEFT))
                        {
                            bool intersectionResult = Common.linesCrossOptimized(recrXMin, rectYMin, recrXMin, rectYMax, from.x, from.y, to.x, to.y, ref intersectionPoint);

                            if (true == intersectionResult)
                            {
                                foundIntersections.Add(ValueTuple.Create(mapNode.LeftSibling, eNeighbourType.RIGHT));
                            }
                        }

                        if (foundIntersections.Count < 2 && false == skipEdges.Contains(eNeighbourType.TOP))
                        {
                            bool intersectionResult = Common.linesCrossOptimized(recrXMin, rectYMax, rectXMax, rectYMax, from.x, from.y, to.x, to.y, ref intersectionPoint);

                            if (true == intersectionResult)
                            {
                                foundIntersections.Add(ValueTuple.Create(mapNode.TopSibling, eNeighbourType.BOTTOM));
                            }
                        }

                        if (foundIntersections.Count < 2 && false == skipEdges.Contains(eNeighbourType.RIGHT))
                        {
                            bool intersectionResult = Common.linesCrossOptimized(rectXMax, rectYMax, rectXMax, rectYMin, from.x, from.y, to.x, to.y, ref intersectionPoint);

                            if (true == intersectionResult)
                            {
                                foundIntersections.Add(ValueTuple.Create(mapNode.RightSibling, eNeighbourType.LEFT));
                            }
                        }

                        if (foundIntersections.Count < 2 && false == skipEdges.Contains(eNeighbourType.BOTTOM))
                        {
                            bool intersectionResult = Common.linesCrossOptimized(rectXMax, rectYMin, recrXMin, rectYMin, from.x, from.y, to.x, to.y, ref intersectionPoint);

                            if (true == intersectionResult)
                            {
                                foundIntersections.Add(ValueTuple.Create(mapNode.BottomSibling, eNeighbourType.TOP));
                            }
                        }

                        skipEdges.Clear();

                        if (1 == foundIntersections.Count)
                        {
                            skipEdges.Add(foundIntersections[0].Item2);
                            mapNode = foundIntersections[0].Item1;
                        }
                        else if (0 == foundIntersections.Count)
                        {
                            mapNode = null;
                        }
                        else if (foundIntersections.Count == 2)
                        {
                            skipEdges.Add(foundIntersections[0].Item2);
                            skipEdges.Add(foundIntersections[1].Item2);

                            cornerCaseHandlerIsActive = true;
                            cornerCaseHandlerFirstNode = foundIntersections[0].Item1;
                            cornerCaseHandlerSecondNode = foundIntersections[1].Item1;
                            cornerCaseHandlerThirdNode = getInvertedNeighbour(foundIntersections[0].Item1, foundIntersections[1].Item2);
                            cornerCaseHandlerThirdNodeFirstSkipEdge = invertNeighbourType(foundIntersections[0].Item2);
                            cornerCaseHandlerThirdNodeSecondSkipEdge = invertNeighbourType(foundIntersections[1].Item2);

                            mapNode = cornerCaseHandlerFirstNode;
                        }
                    }
                };

                if (true == cornerCaseHandlerIsActive)
                {
                    if (mapNode == cornerCaseHandlerFirstNode)
                    {
                        mapNode = cornerCaseHandlerSecondNode;
                    }
                    else if (mapNode == cornerCaseHandlerSecondNode)
                    {
                        mapNode = cornerCaseHandlerThirdNode;
                        skipEdges.Add(cornerCaseHandlerThirdNodeFirstSkipEdge);
                        skipEdges.Add(cornerCaseHandlerThirdNodeSecondSkipEdge);
                    }
                    else if (mapNode == cornerCaseHandlerThirdNode)
                    {
                        cornerCaseHandlerIsActive = false;
                        switchToNextNodeSubFlow();
                    }
                }
                else
                {
                    switchToNextNodeSubFlow();
                }
            };

            mapNode = mMapNodes[startingCell.y][startingCell.x];
            var fromRelativeToNodePos = new Vector2();
            var toRelativeToNodePos = new Vector2();

            if (null != mapNode)
            {
                while (null != mapNode)
                {
                    tileToPointOut(mapNode.TileCoord, ref nodePos);

                    if (false == mapNode.IsWalkable)
                    {
                        var wall = mapNode.WallComponent;

                        if (null == wall)
                        {
                            wall = mDefaultWall;
                        }

                        if (null != wall)
                        {
                            // let's search, which specific edge we've collision with
                            bool collisionFound = false;

                            fromRelativeToNodePos.x = from.x;
                            fromRelativeToNodePos.y = from.y;
                            fromRelativeToNodePos = fromRelativeToNodePos - nodePos;
                            toRelativeToNodePos.x = to.x;
                            toRelativeToNodePos.y = to.y;
                            toRelativeToNodePos = toRelativeToNodePos - nodePos;

                            var angle1 = Common.convertSingleAngleToUpVectorTo_0_360(Common.signAngle(Common.upVector, fromRelativeToNodePos));
                            var angle2 = Common.convertSingleAngleToUpVectorTo_0_360(Common.signAngle(Common.upVector, toRelativeToNodePos));
                            var angleDelta = Common.signAngle(fromRelativeToNodePos, toRelativeToNodePos);

                            var angleFrom = angleDelta > 0 ? angle1 : angle2;
                            var angleTo = angleDelta > 0 ? angle2 : angle1;

                            if (wall.Vertices.Count >= 2)
                            {
                                List<ValueTuple<int,int>> linesToBeChecked = new List<ValueTuple<int, int>>();

                                Action checkAngles = () =>
                                {
                                    if (null != wall)
                                    {
                                        // we should calculate subset of the vertices, which we should check.
                                        if (wall.AngleVertices.Count >= 2)
                                        {
                                            if (math.abs(angleTo - angleFrom) < 0.01) // we have one crossing point
                                            {
                                                var angle = angle1; // we can take any of 2 angles

                                                for (var counter = 0; counter < wall.AngleVertices.Count; ++counter)
                                                {
                                                    if (wall.AngleVertices[counter].Item1 >= angle)
                                                    {
                                                        if (counter == 0)
                                                        {
                                                            linesToBeChecked.Add(ValueTuple.Create(wall.AngleVertices.Count - 1, counter));
                                                        }
                                                        else
                                                        {
                                                            linesToBeChecked.Add(ValueTuple.Create(counter - 1, counter));
                                                        }

                                                        break;
                                                    }
                                                }
                                            }
                                            else // we have 2 crossing points
                                            {
                                                for (var counter = 0; counter < wall.AngleVertices.Count; ++counter)
                                                {
                                                    bool angleRangesCollide = false;

                                                    if (counter == 0)
                                                    {
                                                        angleRangesCollide = Common.checkAngleRangesCollision(angleFrom,
                                                            angleTo,
                                                            wall.AngleVertices[wall.AngleVertices.Count - 1].Item1,
                                                            wall.AngleVertices[counter].Item1);
                                                    }
                                                    else
                                                    {
                                                        angleRangesCollide = Common.checkAngleRangesCollision(angleFrom,
                                                            angleTo,
                                                            wall.AngleVertices[counter - 1].Item1,
                                                            wall.AngleVertices[counter].Item1);
                                                    }

                                                    if (true == angleRangesCollide)
                                                    {
                                                        if (counter == 0)
                                                        {
                                                            linesToBeChecked.Add(ValueTuple.Create(wall.AngleVertices.Count - 1, counter));
                                                        }
                                                        else
                                                        {
                                                            linesToBeChecked.Add(ValueTuple.Create(counter - 1, counter));
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                };

                                checkAngles();

                                float currentLength = 0;
                                float candidateLength = 0;

                                foreach(var line in linesToBeChecked)
                                {
                                    bool intersectionResult = false;

                                    Action lineCrossCheck = () =>
                                    {
                                        if (null != wall)
                                        {
                                            intersectionResult = Common.linesCrossOptimized(
                                                nodePos.x + wall.AngleVertices[line.Item1].Item2.x,
                                                nodePos.y + wall.AngleVertices[line.Item1].Item2.y,
                                                nodePos.x + wall.AngleVertices[line.Item2].Item2.x,
                                                nodePos.y + wall.AngleVertices[line.Item2].Item2.y,
                                                from.x, from.y, to.x, to.y, ref intersectionPoint);
                                        }
                                    };

                                    lineCrossCheck();

                                    Action assignResult = () =>
                                    {
                                        if (true == intersectionResult)
                                        {
                                            collisionFound = true;

                                            if (result.Item1 == false)
                                            {
                                                result.Item2.Item1 = intersectionPoint.x;
                                                result.Item2.Item2 = intersectionPoint.y;
                                                result.Item1 = true;

                                                currentLength = Common.vectorLength(result.Item2.Item1 - from.x, result.Item2.Item2 - from.y);
                                            }
                                            else
                                            {
                                                // compare lengths
                                                candidateLength = Common.vectorLength(intersectionPoint.x - from.x, intersectionPoint.y - from.y);
                                                if (candidateLength < currentLength)
                                                {
                                                    currentLength = candidateLength;
                                                    result.Item2.Item1 = intersectionPoint.x;
                                                    result.Item2.Item2 = intersectionPoint.y;
                                                }
                                            }
                                        }
                                    };

                                    assignResult();
                                }
                            }

                            if (false == collisionFound)
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
                            throw new System.Exception("[LevelMap][raycast] Error! wall == null");
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
                throw new System.Exception("[LevelMap][raycast] Error! mapNode == null!");
            }

            return result;
        }

        public List<ValueTuple<float, float>> formVisiblePolygon(Vector2 point, float radius, Draw2D debugGraphics)
        {
            if (null != debugGraphics)
            {
                debugGraphics.CleanVertices();
            }

            List<ValueTuple<float, float>> result = new List<ValueTuple<float, float>>();

            var nodePos = new Vector2();

            Action<List<ValueTuple<float, float>>> sortVertices = (List <ValueTuple<float, float>> collection)=>
            {
                // we need to sort vertices by angle
                collection.Sort((ValueTuple<float, float> lhs, ValueTuple<float, float> rhs) => 
                {
                    var angleDifference = Common.pseudoangle(lhs.Item1 - point.x, lhs.Item2 - point.y) - Common.pseudoangle(rhs.Item1 - point.x, rhs.Item2 - point.y);
                    if(angleDifference > 0)
                    {
                        return 1;
                    }
                    else if(angleDifference < 0)
                    {
                        return -1;
                    }
                    else
                    {
                        return 0;
                    }
                });
            };

            // are we inside the maze?
            var tileCoord = pointToTile(point);
            if (tileCoord.x > 0 && tileCoord.y > 0 && tileCoord.x < mWidth && tileCoord.y < mHeight)
            {
                // yes, we are inside the maze.
                // Are we inside the wall?
                if (true == mMapNodes[tileCoord.y][tileCoord.x].IsWalkable)
                {
                    // no, we are not inside the wall

                    List<ValueTuple<float,float>> impactingWallVertices = new List<ValueTuple<float, float>>();

                    // Which walls are within the radius of this light source?
                    // Let's build a square around the circle
                    Rect rect = new Rect();
                    rect.x = point.x - radius;
                    rect.y = point.y - radius;
                    rect.width = point.x + radius - rect.x;
                    rect.height = point.y + radius - rect.y;

                    var from = pointToTile(new Vector2(rect.x, rect.y));
                    var to = pointToTile(new Vector2(rect.xMax, rect.yMax));

                    var tileRect = new RectInt();
                    tileRect.x = from.x;
                    tileRect.y = to.y;
                    tileRect.width = to.x - from.x;
                    tileRect.height = from.y - to.y;

                    tileRect = normalizeRect(tileRect);

                    var yMax = tileRect.yMax == mMapNodes.Count ? tileRect.yMax - 1 : tileRect.yMax;
                    var xMax = tileRect.xMax == mMapNodes.Count ? tileRect.xMax - 1 : tileRect.xMax;

                    var vertexWorldCoordinate = new Vector2();
                    var clockwizeAdditionalVec = new Vector2();
                    var counterClockwizeAdditionalVec = new Vector2();
                    var visibilityCheckTmpVec1 = new Vector2();
                    var visibilityCheckTmpVec2 = new Vector2();
                    var visibilityCheckTmpVec3 = new Vector2();
                    var intersectionTmpVec = new Vector2();

                    for (var row = tileRect.y; row <= yMax; ++row)
                    {
                        for (var column = tileRect.x; column <= xMax; ++column)
                        {
                            var mapNode = mMapNodes[row][column];

                            tileToPointOut(mapNode.TileCoord, ref nodePos);

                            if (false == mapNode.IsWalkable)
                            {
                                Wall wall  = mapNode.WallComponent;

                                if (null == wall)
                                {
                                    wall = mDefaultWall;
                                }

                                if (null != wall)
                                {
                                    var counter = 0;

                                    foreach(var vertex in wall.Vertices)
                                    {
                                        vertexWorldCoordinate.x = vertex.x;
                                        vertexWorldCoordinate.y = vertex.y;
                                        vertexWorldCoordinate = vertexWorldCoordinate + nodePos;

                                        if (true == Common.isPointInsideCircle(vertexWorldCoordinate, point, radius))
                                        {
                                            // Here we should put in the impactingWallVertices collection only the vertices, for which 
                                            // both edges, which are containing them are "looking at the origin point"

                                            ValueTuple<float, float, float, float> line1 = ValueTuple.Create(0, 0, 0, 0);
                                            ValueTuple<float, float, float, float> line2 = ValueTuple.Create(0, 0, 0, 0);

                                            if (counter == 0)
                                            {
                                                line1.Item1 = nodePos.x + wall.Vertices[wall.Vertices.Count - 1].x;
                                                line1.Item2 = nodePos.y + wall.Vertices[wall.Vertices.Count - 1].y;
                                                line1.Item3 = nodePos.x + wall.Vertices[counter].x;
                                                line1.Item4 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item1 = nodePos.x + wall.Vertices[counter].x;
                                                line2.Item2 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item3 = nodePos.x + wall.Vertices[counter + 1].x;
                                                line2.Item4 = nodePos.y + wall.Vertices[counter + 1].y;
                                            }
                                            else if (counter == wall.Vertices.Count - 1)
                                            {
                                                line1.Item1 = nodePos.x + wall.Vertices[counter - 1].x;
                                                line1.Item2 = nodePos.y + wall.Vertices[counter - 1].y;
                                                line1.Item3 = nodePos.x + wall.Vertices[counter].x;
                                                line1.Item4 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item1 = nodePos.x + wall.Vertices[counter].x;
                                                line2.Item2 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item3 = nodePos.x + wall.Vertices[0].x;
                                                line2.Item4 = nodePos.y + wall.Vertices[0].y;
                                            }
                                            else
                                            {
                                                line1.Item1 = nodePos.x + wall.Vertices[counter - 1].x;
                                                line1.Item2 = nodePos.y + wall.Vertices[counter - 1].y;
                                                line1.Item3 = nodePos.x + wall.Vertices[counter].x;
                                                line1.Item4 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item1 = nodePos.x + wall.Vertices[counter].x;
                                                line2.Item2 = nodePos.y + wall.Vertices[counter].y;
                                                line2.Item3 = nodePos.x + wall.Vertices[counter + 1].x;
                                                line2.Item4 = nodePos.y + wall.Vertices[counter + 1].y;
                                            }

                                            // here we should check whether the side lines intersect with lines which are formed by "previousm, this", "this, next" lines
                                            visibilityCheckTmpVec1.x = line1.Item1;
                                            visibilityCheckTmpVec1.y = line1.Item2;
                                            visibilityCheckTmpVec2.x = line1.Item1;
                                            visibilityCheckTmpVec2.y = line1.Item2;
                                            visibilityCheckTmpVec3.x = line1.Item3;
                                            visibilityCheckTmpVec3.y = line1.Item4;
                                            var angle1 = Common.signAngle(visibilityCheckTmpVec1 - point, visibilityCheckTmpVec3 - visibilityCheckTmpVec2);
                                            visibilityCheckTmpVec1.x = line2.Item1;
                                            visibilityCheckTmpVec1.y = line2.Item2;
                                            visibilityCheckTmpVec2.x = line2.Item1;
                                            visibilityCheckTmpVec2.y = line2.Item2;
                                            visibilityCheckTmpVec3.x = line2.Item3;
                                            visibilityCheckTmpVec3.y = line2.Item4;
                                            var angle2 = Common.signAngle(visibilityCheckTmpVec1 - point, visibilityCheckTmpVec3 - visibilityCheckTmpVec2);
                                            if (angle1 < 0 && angle1 >= -180 ||
                                                angle2 < 0 && angle2 >= -180)
                                            {
                                                impactingWallVertices.Add(ValueTuple.Create(vertexWorldCoordinate.x, vertexWorldCoordinate.y));

                                                clockwizeAdditionalVec.x = vertexWorldCoordinate.x;
                                                clockwizeAdditionalVec.y = vertexWorldCoordinate.y;
                                                clockwizeAdditionalVec = clockwizeAdditionalVec - point;
                                                Common.Rotate(clockwizeAdditionalVec, -0.01f).Normalize();
                                                clockwizeAdditionalVec = (clockwizeAdditionalVec * radius) + point;

                                                if (false == Common.linesCrossOptimized(line1.Item1, line1.Item2, line1.Item3, line1.Item4, point.x, point.y, clockwizeAdditionalVec.x, clockwizeAdditionalVec.y, ref intersectionTmpVec) &&
                                                false == Common.linesCrossOptimized(line2.Item1, line2.Item2, line2.Item3, line2.Item4, point.x, point.y, clockwizeAdditionalVec.x, clockwizeAdditionalVec.y, ref intersectionTmpVec))
                                                {
                                                    impactingWallVertices.Add(ValueTuple.Create(clockwizeAdditionalVec.x, clockwizeAdditionalVec.y));
                                                }

                                                counterClockwizeAdditionalVec.x = vertexWorldCoordinate.x;
                                                counterClockwizeAdditionalVec.y = vertexWorldCoordinate.y;
                                                counterClockwizeAdditionalVec = counterClockwizeAdditionalVec - point;
                                                Common.Rotate(counterClockwizeAdditionalVec, 0.01f).Normalize();
                                                counterClockwizeAdditionalVec = (counterClockwizeAdditionalVec * radius) + point;

                                                if (false == Common.linesCrossOptimized(line1.Item1, line1.Item2, line1.Item3, line1.Item4, point.x, point.y, counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y, ref intersectionTmpVec) &&
                                                false == Common.linesCrossOptimized(line2.Item1, line2.Item2, line2.Item3, line2.Item4, point.x, point.y, counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y, ref intersectionTmpVec))
                                                {
                                                    impactingWallVertices.Add(ValueTuple.Create(counterClockwizeAdditionalVec.x, counterClockwizeAdditionalVec.y));
                                                }
                                            }
                                        }

                                        ++counter;
                                    }
                                }
                                else
                                {
                                    throw new System.Exception("[LevelMap][formVisiblePolygon] Error! Non-walkable cell is not of type Wall!");
                                }
                            }
                            else
                            {
                                // let's add additional lines to the intersections of the walkable cells with the radius
                                var recrXMin = nodePos.x - mMapNodeSize / 2;
                                var rectYMin = nodePos.y - mMapNodeSize / 2;
                                var rectXMax = nodePos.x + mMapNodeSize / 2;
                                var rectYMax = nodePos.y + mMapNodeSize / 2;

                                List<ValueTuple<float,float,float,float>> edges = new List<ValueTuple<float, float, float, float>>();

                                edges.Add(ValueTuple.Create(recrXMin, rectYMin, recrXMin, rectYMax));
                                edges.Add(ValueTuple.Create(recrXMin, rectYMax, rectXMax, rectYMax));
                                edges.Add(ValueTuple.Create(rectXMax, rectYMax, rectXMax, rectYMin));
                                edges.Add(ValueTuple.Create(rectXMax, rectYMin, recrXMin, rectYMin));

                                foreach(var edge in edges)
                                {
                                    var intersection = Common.closestLineCircleIntersection(point, radius, edge.Item1, edge.Item2, edge.Item3, edge.Item4);

                                    if (true == intersection.Item1)
                                    {
                                        impactingWallVertices.Add(ValueTuple.Create(intersection.Item2.x, intersection.Item2.y));
                                    }
                                }
                            }
                        }
                    }

                    Action addCircleRays = () =>
                    {
                        // Add circle rays
                        for (var i = 0; i < mCircleRays.Count; ++i)
                        {
                            var circleVector = (Common.clone(mCircleRays[i]) * radius) + point;
                            impactingWallVertices.Add(ValueTuple.Create(circleVector.x, circleVector.y));
                        }
                    };

                    addCircleRays();

                    // sort the result by angle
                    sortVertices(impactingWallVertices);

                    // now we have a sub-set of vertices, which could impact the light source
                    // We should raycast to each of them.

                    var collisionResultTmpInputVec = new Vector2();
                    foreach(var impactingVertex in impactingWallVertices)
                    {
                        if (null != debugGraphics)
                        {
                            debugGraphics.vertices.Add(new Vector3(impactingVertex.Item1, impactingVertex.Item2, 0));
                        }

                        collisionResultTmpInputVec.x = impactingVertex.Item1;
                        collisionResultTmpInputVec.y = impactingVertex.Item2;
                        var collisionResult = raycast(point, collisionResultTmpInputVec);

                        if (true == collisionResult.Item1)
                        {
                            if (0 == result.Count)
                            {
                                result.Add( collisionResult.Item2 );
                            }
                            else
                            {
                                if (false == Common.collinearVectors(collisionResult.Item2.Item1, collisionResult.Item2.Item2, result[result.Count - 1].Item1, result[result.Count - 1].Item2))
                                {
                                    result.Add( collisionResult.Item2 );
                                }
                                else
                                {
                                    result[result.Count - 1] = collisionResult.Item2;
                                }
                            }
                        }
                        else
                        {
                            if (0 == result.Count)
                            {
                                result.Add( ValueTuple.Create(collisionResultTmpInputVec.x, collisionResultTmpInputVec.y) );
                            }
                            else
                            {
                                if (false == Common.collinearVectors(collisionResultTmpInputVec.x, collisionResultTmpInputVec.y, result[result.Count - 1].Item1, result[result.Count - 1].Item2))
                                {
                                    result.Add( ValueTuple.Create(collisionResultTmpInputVec.x, collisionResultTmpInputVec.y) );
                                }
                                else
                                {
                                    result[result.Count - 1] = ValueTuple.Create(collisionResultTmpInputVec.x, collisionResultTmpInputVec.y);
                                }
                            }
                        }
                    }

                    debugGraphics.MakeMesh();
                }
                else
                {
                    // yes, we are inside the wall
                    var mapNode = mMapNodes[tileCoord.y][tileCoord.x];

                    // is it a graphics wall?
                    Wall wall = mapNode.WallComponent;

                    if (null == wall)
                    {
                        wall = mDefaultWall;
                    }

                    if (null != wall)
                    {
                        // Yes, it is.
                        var wallWorldPosition = Common.toVec2(wall.gameObject.transform.position);
                        var vertices = wall.Vertices;

                        // Then, let's fetch all the vertices of the wall as a result.
                        foreach(var vertex in vertices)
                        {
                            var shiftedVertex = Common.clone(vertex) + wallWorldPosition;
                            result.Add( ValueTuple.Create(shiftedVertex.x, shiftedVertex.y) );
                        }
                    }
                    else
                    {
                        throw new System.Exception("[LevelMap][formVisiblePolygon] Error! Wall's representation node is null!");
                    }
                }
            }

            sortVertices(result);

            return result;
        }
    }

    public class MapBuilder : MonoBehaviour
    {
        public static MapBuilder sInstance;

        private bool mInitialized = false;
        public bool Initialized { get => mInitialized; }

        [SerializeField]
        int mWidth = 10;
        public int Width { get => mWidth; set => mWidth = value; }

        [SerializeField]
        int mHeight = 10;
        public int Height { get => mHeight; set => mHeight = value; }

        [SerializeField]
        float mMapNodeSize = 100;
        public float MapNodeSize { get => mMapNodeSize; set => mMapNodeSize = value; }

        [SerializeField]
        GameObject mFloorPrefab = null;
        public GameObject FloorPrefab { get => mFloorPrefab; set => mFloorPrefab = value; }

        [SerializeField]
        GameObject mWallPrefab = null;
        public GameObject WallPrefab { get => mWallPrefab; set => mWallPrefab = value; }

        [SerializeField]
        bool mDebug = false;
        public bool Debug { get => mDebug; set => mDebug = value; }

        private LevelMap mMap = null;
        private GameObject mMapGameObject = null;

        public Vector2 getLeftBottompWorldPosition()
        {
            if (null != mMap)
            {
                return mMap.getLeftBottompWorldPosition();
            }

            return new Vector2();
        }

        public void createMap()
        {
            gameObject.transform.position = new Vector3(0, 0, 0);

            if (null != mFloorPrefab && null != mWallPrefab)
            {
                gameObject.transform.DetachChildren();

                mMapGameObject.transform.parent = gameObject.transform;

                mMapGameObject.layer = 11;

                mMap = new LevelMap(mMapGameObject, mWidth, mHeight, mMapNodeSize, mFloorPrefab, mWallPrefab, Debug);
                mInitialized = true;
            }
            else
            {
                throw new System.Exception("[MapBuilder][createMap] Error! Not able to create map!");
            }
        }

        public MapBuilder()
        {
            MapBuilder.sInstance = this;
        }

        void Awake()
        {
            mMapGameObject = new GameObject();
            mMapGameObject.name = "Level";
            createMap();
        }

        public List<Vector2Int> filterTiles(RectInt innerRange, RectInt outterRange, bool walkable = true)
        {
            if (null != mMap)
            {
                return mMap.filterTiles(innerRange, outterRange, walkable);
            }

            throw new System.Exception("[MapBuilder][filterTiles]: Error! mMap == null!");
        }

        public List<Vector2Int> filterTiles2(RectInt range, bool walkable = true)
        {
            if (null != mMap)
            {
                return mMap.filterTiles2(range, walkable);
            }

            throw new System.Exception("[MapBuilder][filterTiles2]: Error! mMap == null!");
        }

        public List<Vector2> findPath(Vector2Int start, Vector2Int finish)
        {
            List<Vector2> result = new List<Vector2>();

            if (null != mMap)
            {

                var path = mMap.findPath(mMap.MapNodes[start.y][start.x], mMap.MapNodes[finish.y][finish.x]);

                foreach (var node in path)
                {
                    if (null != node)
                    {
                        result.Add(tileToPoint(node.TileCoord));
                    }
                }
            }
            else
            {
                throw new System.Exception("[MapBuilder][findPath]: Error! mMap == null!");
            }

            return result;
        }

        public List<Vector2Int> getReachableCells(Vector2Int targetPoint, int minCellDistance, int maxCellDistance)
        {
            if (null != mMap)
            {
                List<Vector2Int> result = new List<Vector2Int>();

                var rechableCells = mMap.getReachableCells(targetPoint, minCellDistance, maxCellDistance);

                foreach (var mapNode in rechableCells)
                {
                    if (null != mapNode)
                    {
                        result.Add(new Vector2Int(mapNode.X, mapNode.Y));
                    }
                }

                return result;
            }
            else
            {
                throw new System.Exception("[MapBuilder][getReachableCells]: Error! mMap == null!");
            }
        }

        public ValueTuple<bool, ValueTuple<float, float>> raycast(Vector2 from, Vector2 to)
        {
            ValueTuple<bool, ValueTuple<float, float>> result = ValueTuple.Create(false, new ValueTuple<float, float>(0, 0)); ;

            if (null != mMap)
            {
                result = mMap.raycast(from, to);
            }
            else
            {
                throw new System.Exception("[MapBuilder][getReachableCells]: Error! mMap == null!");
            }

            return result;
        }

        public void pointToTileOut(Vector2 point, ref Vector2Int result)
        {
            if (null != mMap)
            {
                mMap.pointToTileOut(point, ref result);
            }

            throw new System.Exception("[MapBuilder][pointToTileOut]: Error! mMap == null!");
        }

        public Vector2Int pointToTile(Vector2 point)
        {
            if (null != mMap)
            {
                return mMap.pointToTile(point);
            }

            throw new System.Exception("[MapBuilder][pointToTile]: Error! mMap == null!");
        }

        public void tileToPointOut(Vector2Int tile, ref Vector2 result)
        {
            if (null != mMap)
            {
                mMap.tileToPointOut(tile, ref result);
            }

            throw new System.Exception("[MapBuilder][tileToPointOut]: Error! mMap == null!");
        }

        public Vector2 tileToPoint(Vector2Int tile)
        {
            if (null != mMap)
            {
                return mMap.tileToPoint(tile);
            }

            throw new System.Exception("[MapBuilder][tileToPoint]: Error! mMap == null!");
        }

        public List<ValueTuple<float, float>> formVisiblePolygon(Vector2 point, float radius, Draw2D debugGraphics = null)
        {
            if (null != mMap)
            {
                return mMap.formVisiblePolygon(point, radius, debugGraphics);
            }

            throw new System.Exception("[MapBuilder][formVisiblePolygon]: Error! mMap == null!");
        }

        RectInt normalizeRect(RectInt rect)
        {
            if (null != mMap)
            {
                return mMap.normalizeRect(rect);
            }

            throw new System.Exception("[MapBuilder][normalizeRect]: Error! mMap == null!");
        }

        void Update()
        {
            if (mMap != null)
            {
                mMap.determineVisibleCells();
            }
        }
    }
}