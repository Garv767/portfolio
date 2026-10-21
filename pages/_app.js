import "bootstrap/dist/css/bootstrap.min.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "../src/style.css";
import "../src/App.css";

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
