import { IImageCliperContolesProps } from '@/types/types'
import React from 'react'

export const ImageCliperControls = ({clipRegion, onMouseDown}: IImageCliperContolesProps) => {
  return (
    <>
        <div className="absolute inset-0 bg-black/50" />
        <div
        className="absolute border-2 border-white cursor-move"
        style={{
            left: `${clipRegion.x}px`,
            top: `${clipRegion.y}px`,
            width: `${clipRegion.width}px`,
            height: `${clipRegion.height}px`
        }}
        onMouseDown={onMouseDown}
        >
        <div className="absolute inset-0 bg-transparent" />
        {/* 右下のリサイズハンドル */}
        <div
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-se-resize"
            onMouseDown={(e) => onMouseDown(e, 'se')}
        />
        {/* 右端のリサイズハンドル */}
        <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-e-resize"
            onMouseDown={(e) => onMouseDown(e, 'e')}
        />
        {/* 下端のリサイズハンドル */}
        <div
            className="absolute bottom-[-1.5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full cursor-s-resize"
            onMouseDown={(e) => onMouseDown(e, 's')}
        />
        </div>
    </>
  )
}
