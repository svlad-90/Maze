using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Pool;

namespace Maze_GameManager
{
    public class GameManager : MonoBehaviour
    {
        private Dictionary<string, ObjectPool<GameObject>> mBulletPoolMap = new Dictionary<string, ObjectPool<GameObject>>();

        public Dictionary<string, ObjectPool<GameObject>> BulletPoolMap { get => mBulletPoolMap; set => mBulletPoolMap = value; }

        public static GameManager sInstance = null;

        // Start is called before the first frame update
        void Awake()
        {
            sInstance = this;
        }
    }
}