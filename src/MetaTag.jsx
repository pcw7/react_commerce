import React from "react";
import { Helmet } from "react-helmet";

function MetaTag() {
    return (
        <div>
            <Helmet>
                <title>SHOP</title>
                <meta name="description" content="This is a description of my site." />
                <meta name="keywords" content="React, SEO, React-Helmet" />
            </Helmet>
            {/* <h1>Welcome to My Awesome Site</h1> */}
        </div>
    );
}

export default MetaTag;