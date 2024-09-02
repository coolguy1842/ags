import { OPTIONS_PATH } from "./utils/globals";
import { option } from "./utils/option";
import { OptionsHandler } from "./utils/optionsHandler";

const testing = {
    test1: "f",
    test2: 123
};

export const options = new OptionsHandler({
    test: option(123),
    test2: {
        test: option("test"),
        testing: option(testing)
    }
}, OPTIONS_PATH);

console.log(options.getOption("test").value);