using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Draw2DShapesLite;

namespace Maze_DebugGraphics
{
    public class DebugGraphics
    {
        private GameObject mGraphicsGameObject = new GameObject();
        private Draw2D mInternalGraphics;
        public Draw2D InternalGraphics { get => mInternalGraphics; }
        private MeshRenderer mMeshRenderer;

        public DebugGraphics(Transform parent, int layer = 0)
        {
            mGraphicsGameObject.transform.parent = parent;
            mGraphicsGameObject.name = "Debug graphics";

            mGraphicsGameObject.AddComponent<Draw2D>();
            mInternalGraphics = mGraphicsGameObject.GetComponent<Draw2D>();

            if (null != mInternalGraphics)
            {
                mInternalGraphics.generateCollider = false;
                mInternalGraphics.generateMesh = true;
            }

            mMeshRenderer = mGraphicsGameObject.GetComponent<MeshRenderer>();

            if (null != mMeshRenderer)
            {
                var material = Resources.Load<Material>("DebugGraphics/DebugGraphics");

                if (null != material)
                {
                    mMeshRenderer.material = material;
                }
            }

            mGraphicsGameObject.layer = layer;
        }
        public void clear()
        {
            if(null != mInternalGraphics)
            {
                mInternalGraphics.CleanVertices();
            }
        }

        public void addVertex(Vector2 vertex)
        {
            if (null != mInternalGraphics)
            {
                mInternalGraphics.vertices.Add(vertex);
            }
        }

        public void draw()
        {
            if (null != mInternalGraphics)
            {
                mInternalGraphics.MakeMesh();
            }
        }
    }
}