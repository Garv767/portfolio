export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/resume",
      permanent: false,
    },
  };
}

export default function ResumesIndex() {
  return null;
}
