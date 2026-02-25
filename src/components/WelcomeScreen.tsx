import "./WelcomeScreen.css";

export default function WelcomeScreen() {
    return (
        <>
            <section className="welcome">
                <div className="box">
                    <h1>Welcome to Stellabill</h1>
                    <p>
                        Let's get your merchant account set up in just a few
                        steps
                    </p>
                </div>
                <div className="steps">
                    <div className="num-1">1</div>
                    <span></span>
                    <div className="num-2">2</div>
                    <span></span>
                    <div className="num-3">3</div>
                </div>
            </section>
        </>
    );
}
