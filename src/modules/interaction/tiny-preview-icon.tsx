import { useState } from "react";

//displays a tiny preview of the image and on hover shows the full image
export const TinyPreviewIcon = ({ ...props }) => {
  const [show, setShow] = useState(false);

  const src = props.src;
  return (
    <>
      <div className="relative inline-block">
        <img
          src={src}
          className="w-4 h-4"
          onMouseOver={() => setShow(true)}
          onMouseOut={() => setShow(false)}
        />
        {show && (
          <div className="absolute z-10 w-64 h-64">
            <img src={src} className="w-64 h-64" />
          </div>
        )}
      </div>
    </>
  );
};
