import { Grid, Typography } from "@material-ui/core";
import Typed from "react-typed";
import "../App.css";

const Welcome = (props) => {
  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{padding: "30px", minHeight: "93vh"}}
    >
      <Grid item>
        <Typography variant="h2"> Welcome to Wazafni </Typography>{" "}
      </Grid>{" "}
      <Typed
        className="TYPING"
        strings={[
          "Find your job easy",
          "Best website for employment",
          "Get job in the most companies",
        ]}
        typeSpeed={150}
        backSpeed={100}
        loop
      />
    </Grid>
  );
};

export const ErrorPage = (props) => {
  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{padding: "30px", minHeight: "93vh"}}
    >
      <Grid item>
        <Typography variant="h2"> Error 404 </Typography>{" "}
      </Grid>{" "}
    </Grid>
  );
};

export default Welcome;