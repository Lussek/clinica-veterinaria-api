import supabase from "./config/supabase.js";
import { AppointmentController } from "./controllers/AppointmentController.js";
import { OwnerController } from "./controllers/OwnerController.js";
import { PetController } from "./controllers/PetController.js";
import { AppointmentRepository } from "./repositories/AppointmentRepository.js";
import { OwnerRepository } from "./repositories/OwnerRepository.js";
import { PetRepository } from "./repositories/PetRepository.js";
import { AppointmentService } from "./services/AppointmentService.js";
import { OwnerService } from "./services/OwnerService.js";
import { PetService } from "./services/PetService.js";

/**
 * Composição das dependências (injeção via construtor):
 * Repository (Supabase) -> Service (regras) -> Controller (HTTP).
 */
const ownerRepository = new OwnerRepository(supabase);
const petRepository = new PetRepository(supabase);
const appointmentRepository = new AppointmentRepository(supabase);

const ownerService = new OwnerService(ownerRepository, petRepository);
const petService = new PetService(petRepository, ownerRepository, appointmentRepository);
const appointmentService = new AppointmentService(appointmentRepository, petRepository);

export const controllers = {
    owner: new OwnerController(ownerService),
    pet: new PetController(petService),
    appointment: new AppointmentController(appointmentService),
};
