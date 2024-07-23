import { useEffect, useRef, useState } from "react";

export const DraggableComponent = ({ children, className, ...props }) => {
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const draggableRef = useRef(null);

  const checkOverflow = (element) => {
    return (
      element.scrollWidth > element.clientWidth ||
      element.scrollHeight > element.clientHeight
    );
  };

  const updateDrag = () => {
    const draggableElement = draggableRef.current;
    if (draggableElement && !checkOverflow(draggableElement)) {
      setIsDragEnabled(true);
    } else {
      setIsDragEnabled(false);
    }
  };

  useEffect(() => {
    const draggableElement = draggableRef.current;
    if (draggableElement) {
      const resizeObserver = new ResizeObserver(() => {
        updateDrag();
      });

      resizeObserver.observe(draggableElement);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div
      ref={draggableRef}
      className={`${className} ${isDragEnabled ? "just-drag" : ""}`}
      {...props}
    >
      {children}
    </div>
  );
};
