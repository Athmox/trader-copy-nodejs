import { TestModel } from "./gmx.model";

export class GmxService {

    public test(): TestModel {

        const testModel: TestModel = {name: "Its a test"}

        return testModel;

    }

}