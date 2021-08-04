
import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';
import { Maze_CursorDebugPoint } from './cursorDebugPoint'
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('LightingController')
export class LightingController extends Component 
{
    @property
    Debug:boolean = false;

    private _cursorDebugPointNode: Node = new Node();
    private _cursorDebugPoint: Maze_CursorDebugPoint.CursorDebugPoint|null = null;

    start() 
    {
        this.node.insertChild(this._cursorDebugPointNode, this.node.children.length);
        this._cursorDebugPointNode.parent = this.node;

        this._cursorDebugPointNode.addComponent(Maze_CursorDebugPoint.CursorDebugPoint);
        this._cursorDebugPoint = this._cursorDebugPointNode.getComponent(Maze_CursorDebugPoint.CursorDebugPoint);

        if(null != this._cursorDebugPoint)
        {
            this._cursorDebugPoint.active = this.Debug;
        }
    }
}
