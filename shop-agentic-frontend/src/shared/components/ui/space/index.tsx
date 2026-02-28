interface SpaceProps {
  size?: number;
  vertical?: boolean;
}

function Space({ size = 8, vertical = true }: SpaceProps) {
  return (
    <span
      style={
        vertical
          ? { display: "block", width: 1, height: size }
          : { display: "inline-block", width: size, height: 1 }
      }
      aria-hidden="true"
    />
  );
}

export default Space;
