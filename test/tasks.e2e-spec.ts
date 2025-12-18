import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tasks returns empty array and 200', async () => {
    const res = await request(app.getHttpServer()).get('/tasks').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(0);
  });

  it('GET /tasks/1 returns 404 when not found', async () => {
    await request(app.getHttpServer()).get('/tasks/1').expect(404);
  });

  it('GET /tasks/:id with non-numeric id returns 400', async () => {
    await request(app.getHttpServer()).get('/tasks/abc').expect(400);
  });

  it('GET /tasks/:id with negative id returns 404', async () => {
    await request(app.getHttpServer()).get('/tasks/-1').expect(404);
  });

  let createdId: number;

  it('POST /tasks creates a task (201)', async () => {
    const payload = { title: 'Teste', description: 'Descrição' };
    const res = await request(app.getHttpServer()).post('/tasks').send(payload).expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    expect(res.body.title).toBe(payload.title);
    createdId = res.body.id;
  });

  it('GET /tasks returns array with created task', async () => {
    const res = await request(app.getHttpServer()).get('/tasks').expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /tasks/:id returns the created task', async () => {
    const res = await request(app.getHttpServer()).get(`/tasks/${createdId}`).expect(200);
    expect(res.body.id).toBe(createdId);
  });

  it('POST /tasks with empty title returns 400', async () => {
    const payload = { title: '', description: 'x' };
    await request(app.getHttpServer()).post('/tasks').send(payload).expect(400);
  });

  it('POST /tasks with invalid status returns 400', async () => {
    const payload = { title: 'T', description: 'D', status: 'invalid' };
    await request(app.getHttpServer()).post('/tasks').send(payload).expect(400);
  });

  it('PUT /tasks/:id updates the task', async () => {
    const payload = { title: 'Atualizado' };
    const res = await request(app.getHttpServer()).put(`/tasks/${createdId}`).send(payload).expect(200);
    expect(res.body.title).toBe(payload.title);
  });

  it('GET /tasks/:id with decimal id (1.5) returns 400 Bad Request', async () => {
    await request(app.getHttpServer()).get(`/tasks/${createdId}.5`).expect(400);
  });

  it('PUT /tasks/999 returns 404', async () => {
    await request(app.getHttpServer()).put('/tasks/999').send({ title: 'x' }).expect(404);
  });

  it('DELETE /tasks/:id removes the task', async () => {
    await request(app.getHttpServer()).delete(`/tasks/${createdId}`).expect(204);
    await request(app.getHttpServer()).get(`/tasks/${createdId}`).expect(404);
  });
});
