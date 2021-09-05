using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_Common;
using Draw2DShapesLite;
using System;

namespace Maze_Wall
{
    public class Wall : MonoBehaviour
    {
        [SerializeField]
        [HideInInspector]
        private Vector2 mDimensions = new Vector2(100, 100);
        public Vector2 Dimensions { get => mDimensions; set { mDimensions = value; } }

        [SerializeField]
        [HideInInspector]
        private int mNumberOfVertices = 4;
        public int NumberOfVertices { get => mNumberOfVertices; set { mNumberOfVertices = value; } }

        [SerializeField]
        [HideInInspector]
        private float mExcludeFromCenterFactor = 0.5f;
        public float ExcludeFromCenterFactor { get => mExcludeFromCenterFactor; set { mExcludeFromCenterFactor = value; } }

        private bool mShouldUpdate = true;
        public bool ShouldUpdate { get => mShouldUpdate; set => mShouldUpdate = value; }

        private List<Vector2> mVertices = new List<Vector2>();
        public List<Vector2> Vertices { get => mVertices; }

        private List<ValueTuple<float, Vector2>> mAngleVertices = new List<ValueTuple<float, Vector2>>();
        public List<ValueTuple<float, Vector2>> AngleVertices { get => mAngleVertices; }

        private MeshRenderer mMeshRenderer;
        public MeshRenderer MeshRenderer { get => mMeshRenderer; }


        private PolygonCollider2D mPolygonCollider2DComp;
        private Rigidbody2D mRigidBody;

        private Draw2D mGraphics;

        // Start is called before the first frame update
        public void init()
        {
            if (null == GetComponent<Draw2D>())
            {
                gameObject.AddComponent<Draw2D>();
            }

            if (null == GetComponent<Rigidbody2D>())
            {
                gameObject.AddComponent<Rigidbody2D>();
            }

            if (null == GetComponent<PolygonCollider2D>())
            {
                gameObject.AddComponent<PolygonCollider2D>();
            }

            mGraphics = GetComponent<Draw2D>();
            mRigidBody = GetComponent<Rigidbody2D>();

            mRigidBody.gravityScale = 0;
            mRigidBody.mass = 1000;
            mRigidBody.isKinematic = true;

            mPolygonCollider2DComp = GetComponent<PolygonCollider2D>();
            mMeshRenderer = GetComponent<MeshRenderer>();
        }

        void Start()
        {
            init();
            generateVertices();
        }

        public void generateVertices()
        {
            Vector2 halfDimensions = Common.clone(Dimensions) * 0.5f;
            halfDimensions.x = -halfDimensions.x;
            halfDimensions.y = -halfDimensions.y;

            mVertices = Common.generateConvexPolygon(mDimensions,
                                                          mNumberOfVertices,
                                                          mExcludeFromCenterFactor,
                                                          halfDimensions);

            mAngleVertices.Clear();

            foreach(var vertex in mVertices)
            {
                var angle = Common.signAngle(Common.upVector, vertex);
                mAngleVertices.Add( new ValueTuple<float, Vector2>(Common.convertSingleAngleToUpVectorTo_0_360(angle), vertex) );
            }

            if (null != mPolygonCollider2DComp)
            {
                mPolygonCollider2DComp.points = mVertices.ToArray();
            }

            if (null != mRigidBody)
            {
                mRigidBody.Sleep();
            }

            if (this.mVertices.Count > 0)
            {
                if (null != mGraphics)
                {
                    mGraphics.CleanVertices();
                    var pointsArray = new List<Vector3>(mVertices.Count);

                    foreach (var vertex in mVertices)
                    {
                        pointsArray.Add(Common.toVec3(vertex));
                    }

                    mGraphics.vertices = pointsArray;
                    mGraphics.MakeMesh();
                }
            }
        }
    }
}