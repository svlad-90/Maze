import { _decorator, Component, Node, Graphics, UITransform, Color, systemEvent, SystemEvent, EventMouse } from 'cc';
import { Maze_GlobalMouseListener } from '../globalMouseListener'
import { Maze_EasyReference } from '../easyReference'

export namespace Maze_CursorDebugPoint
{
    export class CursorDebugPoint extends Component 
    {
        private _globalMouseListener: Maze_GlobalMouseListener.GlobalMouseListener|null = null;
        private _painter: Graphics|null = null;
        private _easyReference: Maze_EasyReference.EasyReference|null = null;
        private _uiTransform: UITransform|null = null;
        private _isFireActive: boolean = false;

        private _isActive:boolean = false;
        public set active(val:boolean)
        {
            this._isActive = val;
        }
        public get() : boolean
        {
            return this._isActive;
        }

        onLoad()
        {
            systemEvent.on(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
            systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
        }

        private onMouseDown(event: EventMouse)
        {
            if(event.getButton() == EventMouse.BUTTON_LEFT)
            {
                this._isFireActive = true;
            }
        }

        private onMouseUp(event: EventMouse)
        {
            if(event.getButton() == EventMouse.BUTTON_LEFT)
            {
                this._isFireActive = false;
            }
        }

        start()
        {
            this.addComponent(Maze_GlobalMouseListener.GlobalMouseListener);
            this._globalMouseListener = this.getComponent(Maze_GlobalMouseListener.GlobalMouseListener);
            this.addComponent(Graphics);
            this._painter = this.getComponent(Graphics);
            this._easyReference = new Maze_EasyReference.EasyReference(this.node);
            this._uiTransform = this.getComponent(UITransform);
        }

        update()
        {
            if(true == this._isActive)
            {
                if(null != this._globalMouseListener && null != this._painter && null != this._easyReference && null != this._uiTransform)
                {
                    if(null != this._easyReference.camera)
                    {
                        this._painter.clear();

                        var mousePos = this._uiTransform.convertToNodeSpaceAR( this._easyReference.camera.screenToWorld( this._globalMouseListener.mousePos ) );
                        this._painter.lineWidth = 5;
                        this._painter.color = new Color(255,0,0);
                        this._painter.circle(mousePos.x, mousePos.y, 10);

                        if(true == this._isFireActive)
                        {
                            this._painter.fillColor = new Color(255,0,0);
                        }
                        else
                        {
                            this._painter.fillColor = new Color(0,255,0);
                        }

                        this._painter.stroke();
                        this._painter.fill();
                    }
                }
            }
        }
    }
}