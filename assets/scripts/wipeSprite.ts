
import { _decorator, Component, Node, Material, Sprite, SpriteFrame, dynamicAtlasManager } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('ShaderControl')
@executeInEditMode
export class ShaderControl extends Component 
{
    private _wipe:number = 0;

    private _sprite:Sprite|null = null;
    private _spriteFrame:SpriteFrame|null = null;
    private _material:Material|null = null;

    private set Wipe(val:number)
    {
        this._wipe = val;
        this.Update_Values();
    }
    private get Wipe() : number
    {
        return this._wipe;
    }

    start() 
    {
        this._sprite = this.node.getComponent(Sprite);

        if(null != this._sprite)
        {
            this._spriteFrame = this._sprite.spriteFrame;
            this._material = this._sprite.getMaterial(0);

            if(null != this._spriteFrame)
            {
                // Dynamic Atlas changes the uv values in shader Disable it to use uv values
                this._spriteFrame.packable = false;
            }
        
            this.Update_Values();
        }
    }

    Update_Values()
    {
        if(null != this._material && null != this._spriteFrame)
        {
            this._material.setProperty("rx",this._spriteFrame.rect.x,0);
            this._material.setProperty("ry",this._spriteFrame.rect.y,0);
            this._material.setProperty("rw",this._spriteFrame.rect.width,0);
            this._material.setProperty("rh",this._spriteFrame.rect.height,0);
            this._material.setProperty("tw",this._spriteFrame?.texture.width,0);
            this._material.setProperty("th",this._spriteFrame.texture.height,0);
            this._material.setProperty("wipe",this._wipe,0);
        }
    }

    update()
    {
        this.Wipe += 1;

        if(this.Wipe == 361)
        {
            this.Wipe = 0;
        }
    }
}
