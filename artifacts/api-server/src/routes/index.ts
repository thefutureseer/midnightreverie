import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ticketsRouter from "./tickets";
import hostsRouter from "./hosts";
import venuesRouter from "./venues";
import streamRouter from "./stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ticketsRouter);
router.use(hostsRouter);
router.use(venuesRouter);
router.use(streamRouter);

export default router;
