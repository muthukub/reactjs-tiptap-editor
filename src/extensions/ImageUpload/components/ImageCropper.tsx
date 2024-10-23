/* eslint-disable no-console */
import React, { useRef, useState } from 'react'

import ReactCrop, {
  type Crop,
  type PixelCrop,
} from 'react-image-crop'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useLocale } from '@/locales'
import { dataURLtoFile, readImageAsBase64 } from '@/utils/file'
import { createImageUpload } from '@/plugins/image-upload'

import 'react-image-crop/dist/ReactCrop.css'
import { IconComponent } from '@/components'

export function ImageCropper({ editor, getPos }: any) {
  const { t } = useLocale()

  const [dialogOpen, setDialogOpen] = useState(false)

  const imgRef = React.useRef<HTMLImageElement | null>(null)

  const [crop, setCrop] = React.useState<Crop>()
  const [croppedImageUrl, setCroppedImageUrl] = React.useState<string>('')
  const fileInput = useRef<HTMLInputElement>(null)
  const [urlUpload, setUrlUpload] = useState<any>({
    src: '',
    file: null,
  })

  function onCropComplete(crop: PixelCrop) {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop)
      setCroppedImageUrl(croppedImageUrl)
    }
  }

  function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width * scaleX
    canvas.height = crop.height * scaleY

    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.imageSmoothingEnabled = false

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      )
    }

    return canvas.toDataURL('image/png', 1.0)
  }

  async function onCrop() {
    try {
      const fileCrop = await dataURLtoFile(croppedImageUrl, urlUpload?.file?.name || 'image.png')

      const uploadOptions = editor.extensionManager.extensions.find(
        (extension: any) => extension.name === 'imageUpload',
      )?.options

      const uploadFn = createImageUpload({
        validateFn: () => {
          return true
        },
        onUpload: uploadOptions.upload,
        postUpload: uploadOptions.postUpload,
      })
      uploadFn([fileCrop], editor.view, getPos())

      setDialogOpen(false)

      setUrlUpload({
        src: '',
        file: null,
      })
    }
    catch (error) {
      console.log('Error cropping image', error)
    }
  }

  function handleClick(e: any) {
    e.preventDefault()
    fileInput.current?.click()
  }

  const handleFile = async (event: any) => {
    const files = event?.target?.files
    if (!editor || editor.isDestroyed || files.length === 0) {
      return
    }
    const file = files[0]

    const base64 = await readImageAsBase64(file)

    setDialogOpen(true)
    setUrlUpload({
      src: base64.src,
      file,
    })
  }

  return (
    <>
      <Button className="richtext-w-full richtext-mt-1" size="sm" onClick={handleClick}>
        {t('editor.image.dialog.tab.uploadCrop')}
      </Button>

      <Dialog open={dialogOpen}>
        <DialogTrigger />

        <DialogContent className="[&>button]:richtext-hidden">
          <div>
            {urlUpload.src && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => onCropComplete(c)}
                className="richtext-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={urlUpload.src}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen(false)
                setUrlUpload({
                  src: '',
                  file: null,
                })
              }}
            >
              {t('editor.imageUpload.cancel')}
              <IconComponent name="Trash2" className="richtext-ml-[4px]" />
            </Button>
            <Button className="richtext-w-fit" onClick={onCrop}>
              {t('editor.imageUpload.crop')}
              <IconComponent name="Crop" className="richtext-ml-[4px]" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        multiple
        style={{
          display: 'none',
        }}
        onChange={handleFile}
      />
    </>
  )
}