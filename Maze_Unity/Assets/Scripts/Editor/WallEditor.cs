using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using Maze_Wall;
using UnityEditor.SceneManagement;
using Draw2DShapesLite;

[CustomEditor(typeof(Maze_Wall.Wall))]
[CanEditMultipleObjects]
public class WallEditor : Editor
{
    private Wall mWall;
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();

        if(null != mWall)
        {
            EditorGUI.BeginChangeCheck();
            mWall.Dimensions = EditorGUILayout.Vector2Field("Dimensions", mWall.Dimensions);
            mWall.NumberOfVertices = EditorGUILayout.IntField("Number of vertices", mWall.NumberOfVertices);
            mWall.ExcludeFromCenterFactor = EditorGUILayout.FloatField("Exclude from center factor", mWall.ExcludeFromCenterFactor);

            if(EditorGUI.EndChangeCheck())
            {
                mWall.generateVertices();
            }
        }

        if (GUILayout.Button("Regenerate points"))
        { 
            mWall.generateVertices(); 
        }

        if (GUI.changed){ SetObjectDirty(mWall.gameObject); }
    }

    public void OnEnable()
    {
        mWall = (Wall)target;
        mWall.init();
        mWall.generateVertices();
    }

    public static void SetObjectDirty(GameObject obj)
    {
        EditorUtility.SetDirty(obj);
        EditorSceneManager.MarkSceneDirty(obj.scene);
    }
}
